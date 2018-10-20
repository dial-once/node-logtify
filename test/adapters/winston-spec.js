const assert = require('assert');
const sinon = require('sinon');
const LoggerStream = require('../../src/index');
const Subscriber = require('../../src/subscribers/console-link.js');

describe('Winston adapter ', () => {
  it('should be initialized', () => {
    const { logger } = LoggerStream();
    assert.equal(typeof logger, 'object');
    assert(logger.stream);
    assert.equal(typeof logger.info, 'function');
    assert.equal(typeof logger.silly, 'function');
    assert.equal(typeof logger.verbose, 'function');
    assert.equal(typeof logger.debug, 'function');
    assert.equal(typeof logger.warn, 'function');
    assert.equal(typeof logger.error, 'function');
    assert.equal(typeof logger.log, 'function');
    assert.equal(typeof logger.profile, 'function');
  });

  it('should provide the functionality of a logger', () => {
    const { logger } = LoggerStream();
    const spy = sinon.spy(logger.stream.log);
    logger.stream.log = spy;
    logger.info('Hello world');
    logger.silly('Hello world');
    logger.verbose('Hello world');
    logger.warn('Hello world');
    logger.debug('Hello world', { lol: true }, { foo: 'bar' });
    logger.error('Hello world');
    logger.log('info', 'Hello world');
    assert.equal(spy.called, true);
    assert.equal(spy.callCount, 7);
  });

  it('should profile functions', () => {
    const { logger } = LoggerStream();
    logger.profile('test');
    logger.profile('test');
  });

  it('should be manually configured if initialized before logtify', () => {
    const { streamBuffer } = LoggerStream;
    class TestAdapter {
      constructor(stream, settings) {
        this.settings = settings;
      }
    }
    streamBuffer.addAdapter({
      name: 'test',
      class: TestAdapter
    }, { some: 'configs' });
    const { test } = LoggerStream({ hello: 'world' });
    assert(test);
    assert.deepEqual(test.settings, { some: 'configs', hello: 'world' });
  });

  it('should be auto configured if initialized before logtify', () => {
    const { streamBuffer } = LoggerStream;
    class TestAdapter {
      constructor(stream, settings) {
        this.settings = settings;
      }
    }
    streamBuffer.addAdapter({
      name: 'test',
      class: TestAdapter
    });
    const { test } = LoggerStream({ hello: 'world' });
    assert(test);
    assert.deepEqual(test.settings, { hello: 'world' });
  });

  it('should be auto configured if initialized before logtify [via subscriber]', () => {
    const { streamBuffer } = LoggerStream;
    class TestAdapter {
      constructor(stream, settings) {
        this.settings = settings;
      }
    }
    streamBuffer.addSubscriber({
      class: Subscriber,
      config: { some: 'thing' },
      adapter: {
        name: 'test',
        class: TestAdapter
      }
    });
    const { test } = LoggerStream({ hello: 'world' });
    assert(test);
    assert.deepEqual(test.settings, { some: 'thing', hello: 'world' });
  });

  it('should be manually configured if initialized after logtify', () => {
    class TestAdapter {
      constructor(stream, settings) {
        this.settings = settings;
      }
    }
    const { stream } = LoggerStream({ one: 'two' });
    stream.bindAdapter('custom', new TestAdapter(stream, { hello: 'everyone' }));
    const { custom } = LoggerStream();
    assert(custom);
    assert.deepEqual(custom.settings, { hello: 'everyone' });
  });
});
