const LoggerChain = require('../../src/index');
const assert = require('assert');
const sinon = require('sinon');

describe('Winston adapter ', () => {
  it('should be initialized', () => {
    const { logger } = LoggerChain();
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
    const { logger } = LoggerChain();
    const spy = sinon.spy(logger.stream.log);
    logger.stream.log = spy;
    logger.info('[info] Hello world');
    logger.silly('[silly] Hello world');
    logger.verbose('[verbose] Hello world');
    logger.warn('[warn] Hello world');
    logger.debug('[debug] Hello world', { lol: true }, { foo: 'bar' });
    logger.error('[error] Hello world');
    logger.log('info', 'Hello world');
    assert.equal(spy.called, true);
    assert.equal(spy.callCount, 7);
  });

  it('should profile functions', () => {
    const { logger } = LoggerChain();
    logger.profile('test');
    logger.profile('test');
  });
});
