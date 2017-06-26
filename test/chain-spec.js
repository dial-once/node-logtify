const modulePath = './../src/index';
const logtify = require('./../src/index');
const ConsoleSubscriber = require('./../src/subscribers/console-link');
const WinstonAdapter = require('./../src/adapters/winston');
const assert = require('assert');

describe('Logger stream ', () => {
  beforeEach(() => {
    delete require.cache[require.resolve(modulePath)];
  });

  afterEach(() => {
    delete require.cache[require.resolve(modulePath)];
    const { streamBuffer } = logtify;
    streamBuffer.adapters = {};
    streamBuffer.subscribers = [];
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
    const stream = logtifyInstance.stream;
    assert.equal(typeof stream, 'object');
    assert.equal(typeof stream.settings, 'object');
    assert.equal(typeof stream.Message, 'function');
    assert.equal(typeof stream.Subscriber, 'function');
    assert.equal(typeof stream.log, 'function');
    assert.equal(typeof stream.subscribe, 'function');
  });

  it('should initialize when null config is given ', () => {
    const logtifyInstance = logtify(null);
    assert(logtifyInstance);
    const stream = logtifyInstance.stream;
    assert.equal(typeof stream, 'object');
    assert.equal(typeof stream.settings, 'object');
    assert.equal(typeof stream.Message, 'function');
    assert.equal(typeof stream.Subscriber, 'function');
    assert.equal(typeof stream.log, 'function');
    assert.equal(typeof stream.subscribe, 'function');
  });

  it('should initialize when empty config is given', () => {
    const logtifyInstance = logtify({});
    const stream = logtifyInstance.stream;
    assert.equal(typeof stream, 'object');
    assert.equal(typeof stream.settings, 'object');
    assert.equal(typeof stream.Message, 'function');
    assert.equal(typeof stream.Subscriber, 'function');
    assert.equal(typeof stream.log, 'function');
    assert.equal(typeof stream.subscribe, 'function');
  });

  it('should allow user to reconfigure the module', () => {
    let logtifyInstance = logtify({ hello: 'world' });
    assert(logtifyInstance);
    assert.equal(logtifyInstance.stream.settings.hello, 'world');
    logtifyInstance = logtify({ hello: 'everyone' });
    assert.equal(logtifyInstance.stream.settings.hello, 'everyone');
  });

  it('should behave as a singleton if config was not provided', () => {
    let logtifyInstance = logtify({ hello: 'world' });
    assert(logtifyInstance);
    assert.equal(logtifyInstance.stream.settings.hello, 'world');
    logtifyInstance = logtify();
    assert(logtifyInstance);
    assert.equal(logtifyInstance.stream.settings.hello, 'world');
  });

  it('should support custom subscribers', () => {
    const { streamBuffer } = logtify;
    streamBuffer.addAdapter({
      unicorn: WinstonAdapter
    });
    streamBuffer.addSubscriber(ConsoleSubscriber);
    streamBuffer.addSubscriber(ConsoleSubscriber);
    streamBuffer.addSubscriber(ConsoleSubscriber);
    const { stream, logger, unicorn } = logtify({});
    assert(stream);
    assert(logger);
    assert(unicorn);
    assert.equal(stream.subscribersCount, 4);
  });

  it('should not let adapters override existing ones', () => {
    const { streamBuffer } = logtify;
    streamBuffer.addAdapter({
      name: 'stream',
      class: WinstonAdapter
    });
    streamBuffer.addAdapter({
      unicorn: WinstonAdapter
    });
    const { stream, logger, unicorn } = logtify({});
    assert(stream);
    assert(logger);
    assert(unicorn);
  });

  it('should be able to unbind adapter', () => {
    const { streamBuffer } = logtify;
    streamBuffer.addAdapter({
      stream: WinstonAdapter
    });
    streamBuffer.addAdapter({
      unicorn: WinstonAdapter
    });
    let { stream, unicorn } = logtify({});
    assert(stream);
    assert(unicorn);
    stream.unbindAdapter('unicorn');
    unicorn = logtify().unicorn;
    stream = logtify().stream;
    assert.equal(unicorn, undefined);
    assert.notEqual(stream, undefined);
  });

  it('should not be able to unbind non adapter object', () => {
    const { stream } = logtify({});
    assert(stream);
    stream.unbindAdapter('stream');
    assert(stream);
  });

  it('should skip null undefined or empty object subscriber', () => {
    const { streamBuffer } = logtify;
    streamBuffer.addSubscriber(null);
    streamBuffer.addSubscriber(undefined);
    const { stream } = logtify({});
    assert.equal(stream.subscribersCount, 1);
  });

  it('should throw if subscriber is not valid', () => {
    try {
      const { streamBuffer } = logtify;
      streamBuffer.addSubscriber({ handle: () => {} });
      logtify({});
    } catch (e) {
      assert(e instanceof Error);
    }
  });

  it('should change prototype of pre-configured subscribers', () => {
    class MySubscriber {
      constructor(settings, utility) {
        this.settings = settings;
        this.utility = utility;
      }
      handle(message) { this.next(message); }
      next() {}
      link(next) { this.nextLink = next; }
    }

    const settings = { SOME_SECRET: 'powerpuffgirls' };
    const { streamBuffer } = logtify;
    streamBuffer.addSubscriber({ config: settings, class: MySubscriber });
    const { stream } = logtify({});
    assert.equal(stream.subscribersCount, 2);
  });

  it('should not break down if null is logged (console logging is on)', () => {
    const { stream, logger } = logtify({});
    stream.log(null, null);
    assert(logger);
  });

  it('should be configured according to the preset', () => {
    const stream1 = logtify({ presets: ['dial-once'] }).stream;
    assert.equal(stream1.settings.CONSOLE_LOGGING, true);
    assert.equal(stream1.settings.BUGSNAG_LOGGING, false);
    assert.equal(stream1.settings.LOGENTRIES_LOGGING, false);
    process.env.NODE_ENV = 'staging';
    const { stream, logger } = logtify({ presets: ['dial-once'] });
    assert.equal(stream.settings.CONSOLE_LOGGING, false);
    assert.equal(stream.settings.BUGSNAG_LOGGING, true);
    assert.equal(stream.settings.LOGENTRIES_LOGGING, true);
    assert.equal(stream.subscribersCount, 1);
    assert(logger);
    assert(logger.info);
    stream.log(null, null);
  });
});
