require('./env');
const Message = require('./modules/message');
const ChainLinkUtility = require('./modules/chain-link-utility');
const ConsoleChainLink = require('./chainLinks/console-link');
const Winston = require('./adapters/winston');
const preset = require('./modules/presets');
const assert = require('assert');

let instance;

/**
  @class LoggerChain
  Logging chain. Consists of individual chain links, linked together.
  Executes each chain link separately one after another.

  Exposes chainStart and chanEnd for chain modification outside of the module

  Converts provided parameters into a message package object of the following structure:
  {
    level: {'silly'|'verbose'|'debug'|'info'|'warn'|'error'},
    text: {string},
    meta: {
      instanceId: {string},
      notify: {true}, // by default,
      stack: {string}, // in case message was given to log,
      ... (other metadata provided in runtime)
    }
  }
  Such message package object is frozen, meaning that it can not be modified.
  This is encouraged to make sure each chain link receives identical structure of the message
  @see packMessage @function documentation for detailed implementation

  Chain of Responsibility pattern
  @see http://www.dofactory.com/javascript/chain-of-responsibility-design-pattern
**/
class LoggerChain {
  /**
    @constructor
    @param settings {object} - chain configuration object
    May contain the following parameters:
    - MIN_LOG_LEVEL {string}
    - MIN_LOG_LEVEL_CONSOLE {string} - higher priority than MIN_LOG_LEVEL
    - CONSOLE_LOGGING {boolean}
    Note, however, that env variables have higher priorities than these settings

    Instance of a LoggerChain exposes:
    - settings object
    - ChainLink class - an base class for each chain link (encouraged to use)
    - Message class - packs parameters into a frozen message package
    - chainLinks - Array of active chainLinks
    - chainStart and chainEnd
    - isConnected - whether each chain link is lined to a next one

    New chain element can be added in runtime as the following:
    const chainLinkImpl = new ChainLink();
    const index = chain.push(chainLinkImpl); // index of your chainLink in the array

    New adapter can be added in runtime as the following:
    chain.bindAdapter('logger', new Winston());

    And removed as the following:
    chain.unbindAdapter('logger');
  **/
  constructor(settings) {
    this.settings = settings;
    this.Message = Message;
    this.Utility = ChainLinkUtility;
    this.chainLinks = [];
    this.chainStart = null;
    this.chainEnd = null;
    this.isConnected = false;
    this.adapters = new Map();
  }

  /**
    @function log
    Link the chain if not linked already.
    Compress parameters into an immutable Message package object
    Push it to the start of the chain
    @param logLevel {string} - logging level
    @param message {string|Error} - message to process
    @param args - message metadata
  **/
  log(logLevel, message, ...args) {
    if (!this.isConnected) {
      this.link();
    }
    this.chainStart.handle(new Message(logLevel, message, ...args));
  }

  /**
    @function link
    Connect each chainLink to a next one
  **/
  link() {
    this.isConnected = true;
    for (let i = 0; i < this.chainLinks.length - 1; i++) {
      this.chainLinks[i].link(this.chainLinks[i + 1]);
    }
    if (this.chainStart === null) {
      this.chainStart = this.chainLinks[0];
      this.chainEnd = this.chainLinks[this.chainLinks.length - 1];
    }
  }

  /**
    @function push
    Add a new chain link to the end of the execution chain
    @param chainLink {Object} - chain link implementation
    @return {number} - index of the chain link in the execution chain
  **/
  push(chainLink) {
    assert(chainLink);
    assert(chainLink.handle);
    assert(chainLink.next);
    assert(chainLink.link);
    const index = this.chainLinks.push(chainLink) - 1;
    this.chainStart = this.chainLinks[0];
    this.chainEnd = this.chainLinks[this.chainLinks.length - 1];
    return index;
  }

  /**
    @function bindAdapter
    Add a new adapter to the exposed module instance
    @param adapterName {string} - label for the adapter property in the module instance
    @param adapterInstance {Object} - instance of an adapter

    Example:
      const { chain } = require(..);
      chain.bindAdapter('unicorn', new MyUnicorn(..));

      const { unicorn, chain } = require(..);
      unicorn.yay() // unicorn is now defined
  **/
  bindAdapter(adapterName, adapterInstance) {
    assert(adapterName);
    assert(adapterInstance);
    if (!this.adapters.has(adapterName) && !instance[adapterName]) {
      this.adapters.set(adapterName, '');
      instance[adapterName] = adapterInstance;
    }
  }

  /**
    @function unbindAdapter
    Remove adapter from the exposed module instance
    @param adapterName
  **/
  unbindAdapter(adapterName) {
    assert(adapterName);
    if (this.adapters.has(adapterName)) {
      delete instance[adapterName];
      this.adapters.delete(adapterName);
    }
  }
}

/**
 * Configure and return a chain of processing a log message. It should be required on module launch.
 * It sets up loggers, notifiers for bugs, and exposes the internal providers, abstracted.
 * If no parameter is provided, it will return already configured providers
 * @param  {Object}  [config] Configuration object required by the internal providers
 * @param  {Array}   [config.chainLinks] Array of instances of chainLinks
 * @param  {Object}  [config.adapters] Object with adapters to be exposed
 * @param  {boolean} [config.CONSOLE_LOGGING] Switches on/off the console logging chain
 * @param  {boolean} [config.MIN_LOG_LEVEL] Minimal log level for a message to be processed
 * @param  {boolean} [config.MIN_LOG_LEVEL_CONSOLE] Minimal log level for a message to be processed by console chain link (more prior over MIN_LOG_LEVEL)
 * @param  {boolean} [config.DEFAULT_LOG_LEVEL] Fall back if a message does not have one
 * Note that this module can also be configured with environment variables.
 * Environment variables have higher priority over a settings object
 * @return {Object}  The configured providers
 */
module.exports = (config) => {
  if (!config) {
    if (instance) return instance;
    console.warn('Logtify should be initilised before used without config.');
  }
  const settings = Object.assign({}, config);

  const customChainLinks = settings.chainLinks;
  const adapters = settings.adapters;

  delete settings.chainLinks;
  delete settings.adapters;

  const chain = new LoggerChain(settings);
  instance = { chain };

  // presets
  if (Array.isArray(settings.presets)) {
    Object.assign(settings, preset(settings.presets));
  }

  // default
  const chainLinkIndex = chain.push(new ConsoleChainLink(settings, new ChainLinkUtility()));
  chain.bindAdapter('logger', new Winston(chain, chainLinkIndex));

  // custom
  if (Array.isArray(customChainLinks)) {
    for (const CustomChainLink of customChainLinks) {
      // if constructor
      if (typeof CustomChainLink === 'function') {
        chain.push(new CustomChainLink(settings, new ChainLinkUtility()));
      } else if (CustomChainLink !== null && typeof CustomChainLink === 'object') {
        const chainLinkConfig = CustomChainLink.config || settings;
        const ChainLinkClass = CustomChainLink.class;
        chain.push(new ChainLinkClass(chainLinkConfig, new ChainLinkUtility()));
      }
    }
  }

  if (adapters !== null && typeof adapters === 'object') {
    for (const adapterName of Object.keys(adapters)) {
      chain.bindAdapter(adapterName, new adapters[adapterName](chain, settings));
    }
  }
  return instance;
};
