const modulePath = './../src/index';
const logtify = require('./../src/index');
const ConsoleChainLink = require('./../src/chainLinks/console-link');
const WinstonAdapter = require('./../src/adapters/winston');
const assert = require('assert');

describe('Logger chain ', () => {
  beforeEach(() => {
    delete require.cache[require.resolve(modulePath)];
  });

  afterEach(() => {
    delete require.cache[require.resolve(modulePath)];
    const { chainBuffer } = logtify;
    chainBuffer.adapters = {};
    chainBuffer.chainLinks = [];
  });

  before(() => {
    assert.equal(typeof logtify, 'function');
    this.NODE_ENV = process.env.NODE_ENV;
    this.CONSOLE_LOGGING = process.env.CONSOLE_LOGGING;
    this.BUGSNAG_LOGGING = process.env.BUGSNAG_LOGGING;
    this.LOGENTRIES_LOGGING = process.env.LOGENTRIES_LOGGING;
  });

  after(() => {
    process.env.NODE_ENV = this.NODE_ENV;
    process.env.CONSOLE_LOGGING = this.CONSOLE_LOGGING;
    process.env.BUGSNAG_LOGGING = this.BUGSNAG_LOGGING;
    process.env.LOGENTRIES_LOGGING = this.LOGENTRIES_LOGGING;
  });

  it('should initialize when undefined config is given ', () => {
    const logtifyInstance = logtify(undefined);
    assert(logtifyInstance);
    const chain = logtifyInstance.chain;
    assert.equal(typeof chain, 'object');
    assert.equal(typeof chain.settings, 'object');
    assert.equal(typeof chain.chainStart, 'object');
    assert.equal(typeof chain.chainEnd, 'object');
    assert.equal(typeof chain.chainLinks, 'object');
    assert.equal(typeof chain.Message, 'function');
    assert.equal(typeof chain.ChainLink, 'function');
    assert.equal(typeof chain.log, 'function');
  });

  it('should initialize when null config is given ', () => {
    const logtifyInstance = logtify(null);
    assert(logtifyInstance);
    const chain = logtifyInstance.chain;
    assert.equal(typeof chain, 'object');
    assert.equal(typeof chain.settings, 'object');
    assert.equal(typeof chain.chainStart, 'object');
    assert.equal(typeof chain.chainEnd, 'object');
    assert.equal(typeof chain.chainLinks, 'object');
    assert.equal(typeof chain.Message, 'function');
    assert.equal(typeof chain.ChainLink, 'function');
    assert.equal(typeof chain.log, 'function');
  });

  it('should initialize when empty config is given', () => {
    const logtifyInstance = logtify({});
    const chain = logtifyInstance.chain;
    assert.equal(typeof chain, 'object');
    assert.equal(typeof chain.settings, 'object');
    assert.equal(typeof chain.chainStart, 'object');
    assert.equal(typeof chain.chainEnd, 'object');
    assert.equal(typeof chain.chainLinks, 'object');
    assert.equal(typeof chain.Message, 'function');
    assert.equal(typeof chain.ChainLink, 'function');
    assert.equal(typeof chain.log, 'function');
  });

  it('should allow user to reconfigure the module', () => {
    let logtifyInstance = logtify({ hello: 'world' });
    assert(logtifyInstance);
    assert.equal(logtifyInstance.chain.settings.hello, 'world');
    logtifyInstance = logtify({ hello: 'everyone' });
    assert.equal(logtifyInstance.chain.settings.hello, 'everyone');
  });

  it('should behave as a singleton if config was not provided', () => {
    let logtifyInstance = logtify({ hello: 'world' });
    assert(logtifyInstance);
    assert.equal(logtifyInstance.chain.settings.hello, 'world');
    logtifyInstance = logtify();
    assert(logtifyInstance);
    assert.equal(logtifyInstance.chain.settings.hello, 'world');
  });

  it('should support custom chainLinks', () => {
    const { chainBuffer } = logtify;
    chainBuffer.addAdapter({
      unicorn: WinstonAdapter
    });
    chainBuffer.addChainLink(ConsoleChainLink);
    chainBuffer.addChainLink(ConsoleChainLink);
    chainBuffer.addChainLink(ConsoleChainLink);
    const { chain, logger, unicorn } = logtify({});
    assert(chain);
    assert(logger);
    assert(unicorn);
    assert.equal(chain.chainLinks.length, 4);
  });

  it('should not let adapters override existing ones', () => {
    const { chainBuffer } = logtify;
    chainBuffer.addAdapter({
      name: 'chain',
      class: WinstonAdapter
    });
    chainBuffer.addAdapter({
      unicorn: WinstonAdapter
    });
    const { chain, logger, unicorn } = logtify({});
    assert(chain);
    assert(Array.isArray(chain.chainLinks));
    assert(logger);
    assert(unicorn);
  });

  it('should be able to unbind adapter', () => {
    const { chainBuffer } = logtify;
    chainBuffer.addAdapter({
      chain: WinstonAdapter
    });
    chainBuffer.addAdapter({
      unicorn: WinstonAdapter
    });
    let { chain, unicorn } = logtify({});
    assert(chain);
    assert(Array.isArray(chain.chainLinks));
    assert(unicorn);
    chain.unbindAdapter('unicorn');
    unicorn = logtify().unicorn;
    chain = logtify().chain;
    assert.equal(unicorn, undefined);
    assert.notEqual(chain, undefined);
  });

  it('should not be able to unbind non adapter object', () => {
    const { chain } = logtify({});
    assert(chain);
    assert(Array.isArray(chain.chainLinks));
    chain.unbindAdapter('chain');
    assert(chain);
    assert(Array.isArray(chain.chainLinks));
  });

  it('should skip null undefined or empty object chainLink', () => {
    const { chainBuffer } = logtify;
    chainBuffer.addChainLink(null);
    chainBuffer.addChainLink(undefined);
    const { chain } = logtify({});
    assert.equal(chain.chainLinks.length, 1);
  });

  it('should throw if chainLink is not valid', () => {
    try {
      const { chainBuffer } = logtify;
      chainBuffer.addChainLink({ handle: () => {} });
      logtify({});
    } catch (e) {
      assert(e instanceof Error);
    }
  });

  it('should change prototype of pre-configured chainLinks', () => {
    class MyChainLink {
      constructor(settings, utility) {
        this.settings = settings;
        this.utility = utility;
      }
      handle(message) { this.next(message); }
      next() {}
      link(next) { this.nextLink = next; }
    }

    const settings = { SOME_SECRET: 'powerpuffgirls' };
    const { chainBuffer } = logtify;
    chainBuffer.addChainLink({ config: settings, class: MyChainLink });
    const { chain } = logtify({});
    assert.equal(chain.chainLinks.length, 2);
    assert.equal(typeof chain.chainEnd.handle, 'function');
    assert.equal(typeof chain.chainEnd.next, 'function');
    assert.equal(typeof chain.chainEnd.link, 'function');
  });

  it('should not break down if null is logged (console logging is on)', () => {
    const { chain, logger } = logtify({});
    chain.log(null, null);
    assert(logger);
  });

  it('should be configured according to the preset', () => {
    const chain1 = logtify({ presets: ['dial-once'] }).chain;
    assert.equal(chain1.settings.CONSOLE_LOGGING, true);
    assert.equal(chain1.settings.BUGSNAG_LOGGING, false);
    assert.equal(chain1.settings.LOGENTRIES_LOGGING, false);
    process.env.NODE_ENV = 'staging';
    const { chain, logger } = logtify({ presets: ['dial-once'] });
    assert.equal(chain.settings.CONSOLE_LOGGING, false);
    assert.equal(chain.settings.BUGSNAG_LOGGING, true);
    assert.equal(chain.settings.LOGENTRIES_LOGGING, true);
    assert.equal(chain.chainLinks.length, 1);
    assert(logger);
    assert(logger.info);
    chain.log(null, null);
  });
});
