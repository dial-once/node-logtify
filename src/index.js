require('./env');
const assert = require('assert');
const EventEmitter = require('events');
const Message = require('./modules/message');
const Subscriber = require('./modules/subscriber');
const ConsoleSubscriber = require('./subscribers/console-link');
const Winston = require('./adapters/winston');
const StreamBuffer = require('./modules/stream-buffer');
const preset = require('./modules/presets');

let instance;
const buffer = new StreamBuffer();

/**
 * @class LoggerStream
  Logging stream. Consists of individual stream links, linked together.

  Exposes streamStart and streamEnd for stream modification outside of the module

  Converts provided parameters into a message package object of the following structure:
  {
    level: {'silly'|'verbose'|'debug'|'info'|'warn'|'error'},
    text: {string},
    meta: {
      instanceId: {string},
      notify: {true}, // by default,
      stack: {string}, // in case error was given to log,
      ... (other metadata provided in runtime)
    },
    error: {Error} // in case a message was an error
  }
  Such message package object is frozen, meaning that it can not be modified.
  This is encouraged to make sure each stream link receives identical structure of the message
  @see packMessage @function documentation for detailed implementation
  */
class LoggerStream extends EventEmitter {
  /**
   * @constructor
    @param settings {object} - stream configuration object
    May contain the following parameters:
    - MIN_LOG_LEVEL {string}
    - MIN_LOG_LEVEL_CONSOLE {string} - higher priority than MIN_LOG_LEVEL
    - CONSOLE_LOGGING {boolean}
    Note, however, that env variables have higher priorities than these settings

    Instance of a LoggerStream exposes:
    - settings object
    - Utility class - common rules for each stream link
    - Message class - packs parameters into a frozen message package
    - subscribers - Array of active subscribers
    - streamStart and streamEnd
    - isConnected - whether each stream link is lined to a next one
    - adapters {Map} - {string} - {Object} entries of adapter names and objects

    New stream element can be added in runtime as the following:
    const index = stream.push(subscriberImpl); // index of your subscriber in the array

    New adapter can be added in runtime as the following:
    stream.bindAdapter('logger', new Winston());

    And removed as the following:
    stream.unbindAdapter('logger');
   */
  constructor(settings) {
    super();
    this.settings = settings;
    this.Message = Message;
    this.Subscriber = Subscriber;
    this.adapters = new Map();
    this.log = this.log.bind(this);
  }

  /**
   * @function log
   * Link the stream
   * if not linked already.
   * Compress parameters into an immutable Message package object
   * Push it to the start of the stream
   * @param logLevel {
   *   string
   * } - logging level
   * @param message {
   *  string | Error
   * } - message to process
   * @param args - message metadata
   */
  log(logLevel, message, ...args) {
    const subscriberMessage = new Message(logLevel, message, ...args);
    return this.emit('message', subscriberMessage);
  }

  /**
   * Subsctibe to to the logger stream
   * @param  {Object|Subscriber} subscriber a subscriber implementation instance
   * @return {Object|Rx.Observable} observable object, getting events from the stream as they appear
   */
  subscribe(subscriber) {
    return this.on('message', message => subscriber.handle(message));
  }

  /**
   * Get currect subscribers count
   * @return {Number} current amount of subscribers to the loggerStream
   */
  get subscribersCount() {
    return this.listenerCount('message');
  }

  /**
   * @function bindAdapter
   * Add a new adapter to the exposed module instance
   * @param adapterName {string} - label for the adapter property in the module instance
   * @param adapterInstance {Object} - instance of an adapter
   *
   * Example:
   *  const { stream } = require(..);
   *  stream.bindAdapter('unicorn', new MyUnicorn(..));
   *
   *  const { unicorn, stream } = require(..);
   *  unicorn.yay() // unicorn is now defined
   */
  bindAdapter(adapterName, adapterInstance) {
    assert(adapterName);
    assert(adapterInstance);
    if (!this.adapters.has(adapterName) && !instance[adapterName]) {
      this.adapters.set(adapterName, adapterInstance);
      instance[adapterName] = adapterInstance;
    }
  }

  /**
   * @function unbindAdapter
   * Remove adapter from the exposed module instance
   * @param adapterName
   */
  unbindAdapter(adapterName) {
    assert(adapterName);
    if (this.adapters.has(adapterName)) {
      delete instance[adapterName];
      this.adapters.delete(adapterName);
    }
  }
}

/**
 * Unsubscribe all subscribers from current stream
 */
function disposeStream() {
  if (!instance) {
    return;
  }
  instance.stream.removeAllListeners('message');
}

process.once('exit', disposeStream);
process.once('SIGINT', disposeStream);
process.once('SIGTERM', disposeStream);
process.once('uncaughtException', disposeStream);

/**
 * Configure and return a stream of processing a log message. It should be required on module launch.
 * It sets up loggers, notifiers for bugs, and exposes the internal providers, abstracted.
 * If no parameter is provided, it will return already configured providers
 * @param  {Object}  [config] Configuration object required by the internal providers
 * @param  {Array}   [config.subscribers] Array of instances of subscribers
 * @param  {Object}  [config.adapters] Object with adapters to be exposed
 * @param  {boolean} [config.CONSOLE_LOGGING] Switches on/off the console logging stream
 * @param  {boolean} [config.MIN_LOG_LEVEL] Minimal log level for a message to be processed
 * @param  {boolean} [config.MIN_LOG_LEVEL_CONSOLE] Minimal log level for a message to be processed by console stream link (more prior over MIN_LOG_LEVEL)
 * @param  {boolean} [config.DEFAULT_LOG_LEVEL] Fall back if a message does not have one
 * Note that this module can also be configured with environment variables.
 * Environment variables have higher priority over a settings object
 * @return {Object}  The configured providers
 */
module.exports = (config) => {
  if (!config && instance) {
    return instance;
  }

  disposeStream();

  let settings = Object.assign({}, config);
  // presets
  if (Array.isArray(settings.presets)) {
    // a whole settings object is passed to initialize the stream links (if wrapped into a function)
    const presetConfigs = preset(settings);
    // merging other preset-given configs
    settings = Object.assign(presetConfigs, settings);
  }

  // pulling data from buffer
  let { adapters } = buffer;
  const { subscribers } = buffer;

  const stream = new LoggerStream(settings);
  instance = { stream };

  // adding default Console stream link
  const consoleSubscriber = new ConsoleSubscriber(settings);
  stream.subscribe(consoleSubscriber);
  stream.bindAdapter('logger', new Winston(stream, consoleSubscriber));

  // Custom subscribers
  for (const CustomSubscriber of subscribers) {
    // if constructor passed in the array
    if (typeof CustomSubscriber === 'function') {
      stream.subscribe(new CustomSubscriber(settings));
      // if a pre-configured subscriber with some link-specific settings
    } else if (CustomSubscriber !== null && typeof CustomSubscriber === 'object') {
      const subscriberConfig = Object.assign({}, CustomSubscriber.config, settings);
      const SubscriberClass = CustomSubscriber.class;
      stream.subscribe(new SubscriberClass(subscriberConfig));
      // if a pre-configured object also exposes adapter
      if (CustomSubscriber.adapter !== null && typeof CustomSubscriber.adapter === 'object') {
        const { adapter } = CustomSubscriber;
        adapters = Object.assign({}, adapters, {
          [adapter.name]: {
            class: adapter.class,
            config: CustomSubscriber.config
          }
        });
      }
    }
  }
  /* Custom adapters
     adapter key-value objects:
     {
      [name]: {
        class: constructor,
        config: { Object } // optional
      }
     }
  */
  if (adapters !== null && typeof adapters === 'object') {
    for (const adapterName of Object.keys(adapters)) {
      const AdapterClass = adapters[adapterName].class;
      const adapterSettings = Object.assign({}, adapters[adapterName].config, settings);
      stream.bindAdapter(adapterName, new AdapterClass(stream, adapterSettings));
    }
  }

  return instance;
};

module.exports.streamBuffer = buffer;
