const assert = require('assert');
const Subscriber = require('../../src/modules/subscriber');

describe('Chain link ', () => {
  before(() => {
    delete process.env.MIN_LOG_LEVEL;
    delete process.env.MIN_LOG_LEVEL_CONSOLE;
    delete process.env.LOG_TIMESTAMP;
    delete process.env.LOG_ENVIRONMENT;
    delete process.env.LOG_LEVEL;
    delete process.env.LOG_REQID;
  });

  after(() => {
    delete process.env.MIN_LOG_LEVEL;
    delete process.env.MIN_LOG_LEVEL_CONSOLE;
  });

  it('should expose its main functions', () => {
    assert.equal(typeof Subscriber, 'function');
    const subscriber = new Subscriber();
    assert.equal(typeof subscriber, 'object');
    assert(subscriber.logLevels instanceof Map);
    assert.equal(typeof subscriber.getMinLogLevel, 'function');
  });

  it('should return info as default min log level if not given in config / env', () => {
    const subscriber = new Subscriber();
    const minLogLevel = subscriber.getMinLogLevel();
    assert.equal(minLogLevel, 'info');
  });

  it('should return min log level from settings [no env]', () => {
    const subscriber = new Subscriber();
    const minLogLevel = subscriber.getMinLogLevel({ MIN_LOG_LEVEL: 'error' });
    assert.equal(minLogLevel, 'error');
  });

  it('should return min log level from env [no settings]', () => {
    process.env.MIN_LOG_LEVEL = 'warn';
    const subscriber = new Subscriber();
    const minLogLevel = subscriber.getMinLogLevel();
    assert.equal(minLogLevel, 'warn');
  });

  it('should return min log level from env [env and settings]', () => {
    process.env.MIN_LOG_LEVEL = 'warn';
    const subscriber = new Subscriber();
    const minLogLevel = subscriber.getMinLogLevel({ MIN_LOG_LEVEL: 'error' });
    assert.equal(minLogLevel, 'warn');
  });

  it('stream env min log level should have a higher priority than global env and settings [env and settings]', () => {
    process.env.MIN_LOG_LEVEL = 'warn';
    process.env.MIN_LOG_LEVEL_CONSOLE = 'info';
    const subscriber = new Subscriber();
    const minLogLevel = subscriber.getMinLogLevel({ MIN_LOG_LEVEL: 'error' }, 'CONSOLE');
    assert.equal(minLogLevel, 'info');
  });

  it('should return default log level if typo was done', () => {
    process.env.MIN_LOG_LEVEL = 'weird';
    const subscriber = new Subscriber();
    const minLogLevel = subscriber.getMinLogLevel({ MIN_LOG_LEVEL: 'error' });
    assert.equal(minLogLevel, 'info');
  });
});
