const assert = require('assert');
const ChainLink = require('../../src/modules/chain-link');

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
    assert.equal(typeof ChainLink, 'function');
    const chainLink = new ChainLink();
    assert.equal(typeof chainLink, 'object');
    assert(chainLink.logLevels instanceof Map);
    assert.equal(typeof chainLink.getMinLogLevel, 'function');
  });

  it('should return info as default min log level if not given in config / env', () => {
    const chainLink = new ChainLink();
    const minLogLevel = chainLink.getMinLogLevel();
    assert.equal(minLogLevel, 'info');
  });

  it('should return min log level from settings [no env]', () => {
    const chainLink = new ChainLink();
    const minLogLevel = chainLink.getMinLogLevel({ MIN_LOG_LEVEL: 'error' });
    assert.equal(minLogLevel, 'error');
  });

  it('should return min log level from env [no settings]', () => {
    process.env.MIN_LOG_LEVEL = 'warn';
    const chainLink = new ChainLink();
    const minLogLevel = chainLink.getMinLogLevel();
    assert.equal(minLogLevel, 'warn');
  });

  it('should return min log level from env [env and settings]', () => {
    process.env.MIN_LOG_LEVEL = 'warn';
    const chainLink = new ChainLink();
    const minLogLevel = chainLink.getMinLogLevel({ MIN_LOG_LEVEL: 'error' });
    assert.equal(minLogLevel, 'warn');
  });

  it('chain env min log level should have a higher priority than global env and settings [env and settings]', () => {
    process.env.MIN_LOG_LEVEL = 'warn';
    process.env.MIN_LOG_LEVEL_CONSOLE = 'info';
    const chainLink = new ChainLink();
    const minLogLevel = chainLink.getMinLogLevel({ MIN_LOG_LEVEL: 'error' }, 'CONSOLE');
    assert.equal(minLogLevel, 'info');
  });

  it('should return default log level if typo was done', () => {
    process.env.MIN_LOG_LEVEL = 'weird';
    const chainLink = new ChainLink();
    const minLogLevel = chainLink.getMinLogLevel({ MIN_LOG_LEVEL: 'error' });
    assert.equal(minLogLevel, 'info');
  });
});
