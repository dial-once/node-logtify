const assert = require('assert');
const sinon = require('sinon');
const ConsoleLink = require('../../src/chainLinks/console-link');
const ChainLinkUtility = require('../../src/modules/chain-link-utility');
const Message = require('../../src/modules/message');

describe('Console chain link ', () => {
  before(() => {
    delete process.env.MIN_LOG_LEVEL;
    delete process.env.MIN_LOG_LEVEL_CONSOLE;
    delete process.env.LOG_TIMESTAMP;
    delete process.env.LOG_ENVIRONMENT;
    delete process.env.LOG_LEVEL;
    delete process.env.LOG_REQID;
  });

  afterEach(() => {
    delete process.env.CONSOLE_LOGGING;
    delete process.env.MIN_LOG_LEVEL;
    delete process.env.MIN_LOG_LEVEL_CONSOLE;
  });

  it('should not throw if no settings are given', () => {
    assert(typeof ConsoleLink, 'function');
    const consoleChain = new ConsoleLink(null, new ChainLinkUtility());
    assert.notEqual(consoleChain.winston, undefined);
  });

  it('should expose its main functions', () => {
    const consoleChain = new ConsoleLink({}, new ChainLinkUtility());
    assert(typeof consoleChain, 'object');
    assert.equal(typeof consoleChain.isReady, 'function');
    assert.equal(typeof consoleChain.isEnabled, 'function');
    assert.equal(typeof consoleChain.handle, 'function');
    assert.equal(typeof consoleChain.next, 'function');
    assert.equal(typeof consoleChain.link, 'function');
    assert.equal(consoleChain.nextLink, null);
    assert.deepEqual(consoleChain.settings, {});
  });

  it('should return true/false if initialized/not initialized', () => {
    const consoleChain = new ConsoleLink(null, new ChainLinkUtility());
    assert.equal(consoleChain.isReady(), true);
    delete consoleChain.winston;
    assert.equal(consoleChain.isReady(), false);
  });

  it('should indicate if it is switched on/off [settings]', () => {
    let consoleChain = new ConsoleLink({ CONSOLE_LOGGING: true }, new ChainLinkUtility());
    assert.equal(consoleChain.isEnabled(), true);
    consoleChain = new ConsoleLink({ CONSOLE_LOGGING: false }, new ChainLinkUtility());
    assert.equal(consoleChain.isEnabled(), false);
    consoleChain = new ConsoleLink({}, new ChainLinkUtility());
    assert.equal(consoleChain.isEnabled(), false);
  });

  it('should indicate if it is switched on/off [envs]', () => {
    const consoleChain = new ConsoleLink({}, new ChainLinkUtility());
    assert.equal(consoleChain.isEnabled(), false);
    process.env.CONSOLE_LOGGING = true;
    assert.equal(consoleChain.isEnabled(), true);
    process.env.CONSOLE_LOGGING = false;
    assert.equal(consoleChain.isEnabled(), false);
  });

  it('should indicate if it is switched on/off [envs should have more privilege]', () => {
    const consoleChain = new ConsoleLink({ CONSOLE_LOGGING: true }, new ChainLinkUtility());
    assert.equal(consoleChain.isEnabled(), true);
    process.env.CONSOLE_LOGGING = false;
    assert.equal(consoleChain.isEnabled(), false);
    process.env.CONSOLE_LOGGING = undefined;
    assert.equal(consoleChain.isEnabled(), true);
  });

  it('should not break down if null is logged', () => {
    const consoleChain = new ConsoleLink({ CONSOLE_LOGGING: 'true' }, new ChainLinkUtility());
    consoleChain.handle(null);
  });

  it('should log message if CONSOLE_LOGGING = true', () => {
    const consoleChain = new ConsoleLink({ CONSOLE_LOGGING: 'true' }, new ChainLinkUtility());
    const spy = sinon.spy(consoleChain.winston.log);
    consoleChain.winston.log = spy;
    const message = new Message();
    consoleChain.handle(message);
    assert(spy.called);
  });

  it('should not log message if CONSOLE_LOGGING = false', () => {
    const consoleChain = new ConsoleLink({ CONSOLE_LOGGING: 'false' }, new ChainLinkUtility());
    const spy = sinon.spy(consoleChain.winston.log);
    consoleChain.winston.log = spy;
    const message = new Message();
    consoleChain.handle(message);
    assert(spy.called);
  });

  it('should not log if message level < MIN_LOG_LEVEL [settings]', () => {
    const consoleChain = new ConsoleLink({
      CONSOLE_LOGGING: 'true',
      MIN_LOG_LEVEL: 'error'
    }, new ChainLinkUtility());
    const spy = sinon.spy(consoleChain.winston.log);
    consoleChain.winston.log = spy;
    const message = new Message();
    consoleChain.handle(message);
    assert(!spy.called);
  });

  it('should not log if message level < MIN_LOG_LEVEL [envs]', () => {
    const consoleChain = new ConsoleLink({ CONSOLE_LOGGING: 'true' }, new ChainLinkUtility());
    const spy = sinon.spy(consoleChain.winston.log);
    consoleChain.winston.log = spy;
    const message = new Message();
    process.env.MIN_LOG_LEVEL = 'error';
    consoleChain.handle(message);
    assert(!spy.called);
  });

  it('should log if message level >= MIN_LOG_LEVEL_CONSOLE but < MIN_LOG_LEVEL [envs]', () => {
    const consoleChain = new ConsoleLink({ CONSOLE_LOGGING: 'true' }, new ChainLinkUtility());
    const spy = sinon.spy(consoleChain.winston.log);
    consoleChain.winston.log = spy;
    const message = new Message('warn');
    process.env.MIN_LOG_LEVEL = 'error';
    process.env.MIN_LOG_LEVEL_CONSOLE = 'warn';
    consoleChain.handle(message);
    assert(spy.called);
  });

  it('should log if message level = MIN_LOG_LEVEL [envs]', () => {
    const consoleChain = new ConsoleLink({ CONSOLE_LOGGING: 'true' }, new ChainLinkUtility());
    const spy = sinon.spy(consoleChain.winston.log);
    consoleChain.winston.log = spy;
    const message = new Message('error');
    process.env.MIN_LOG_LEVEL = 'error';
    consoleChain.handle(message);
    assert(spy.called);
  });

  it('should log if message level > MIN_LOG_LEVEL [envs]', () => {
    const consoleChain = new ConsoleLink({ CONSOLE_LOGGING: 'true' }, new ChainLinkUtility());
    const spy = sinon.spy(consoleChain.winston.log);
    consoleChain.winston.log = spy;
    const message = new Message('error');
    process.env.MIN_LOG_LEVEL = 'warn';
    consoleChain.handle(message);
    assert(spy.called);
  });

  it('should not throw if next link does not exist', () => {
    const chainLink = new ConsoleLink({}, new ChainLinkUtility());
    chainLink.next();
  });

  it('should link a new chainLink', () => {
    const chainLink = new ConsoleLink({}, new ChainLinkUtility());
    const spy = sinon.spy(sinon.stub());
    const mock = {
      handle: spy
    };
    assert.equal(chainLink.nextLink, null);
    chainLink.link(mock);
    assert.equal(typeof chainLink.nextLink, 'object');
    chainLink.next();
    assert(spy.called);
  });
});
