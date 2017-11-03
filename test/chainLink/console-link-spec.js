const assert = require('assert');
const sinon = require('sinon');
const ConsoleLink = require('../../src/subscribers/console-link');
const Message = require('../../src/modules/message');

describe('Console chain link ', () => {
  before(() => {
    this.MIN_LOG_LEVEL = process.env.MIN_LOG_LEVEL;
    delete process.env.MIN_LOG_LEVEL;
    this.LOG_TIMESTAMP = process.env.LOG_TIMESTAMP;
    delete process.env.LOG_TIMESTAMP;
    this.LOG_ENVIRONMENT = process.env.LOG_ENVIRONMENT;
    delete process.env.LOG_ENVIRONMENT;
    this.LOG_LEVEL = process.env.LOG_LEVEL;
    delete process.env.LOG_LEVEL;
    this.LOG_REQID = process.env.LOG_REQID;
    delete process.env.LOG_REQID;
    this.JSONIFY = process.env.JSONIFY;
    delete process.env.JSONIFY;
  });

  afterEach(() => {
    delete process.env.CONSOLE_LOGGING;
    delete process.env.MIN_LOG_LEVEL;
    delete process.env.JSONIFY;
  });

  after(() => {
    process.env.MIN_LOG_LEVEL = this.MIN_LOG_LEVEL;
    process.env.LOG_TIMESTAMP = this.LOG_TIMESTAMP;
    process.env.LOG_ENVIRONMENT = this.LOG_ENVIRONMENT;
    process.env.LOG_LEVEL = this.LOG_LEVEL;
    process.env.LOG_REQID = this.LOG_REQID;
    process.env.JSONIFY = this.JSONIFY;
  });

  it('should not throw if no settings are given', () => {
    assert(typeof ConsoleLink, 'function');
    const consoleChain = new ConsoleLink(null);
    assert.notEqual(consoleChain.winston, undefined);
  });

  it('should expose its main functions', () => {
    const consoleChain = new ConsoleLink({});
    assert(typeof consoleChain, 'object');
    assert.equal(typeof consoleChain.isReady, 'function');
    assert.equal(typeof consoleChain.isEnabled, 'function');
    assert.equal(typeof consoleChain.handle, 'function');
    assert.deepEqual(consoleChain.settings, {});
  });

  it('should return true/false if initialized/not initialized', () => {
    const consoleChain = new ConsoleLink(null);
    assert.equal(consoleChain.isReady(), true);
    delete consoleChain.winston;
    assert.equal(consoleChain.isReady(), false);
  });

  it('should indicate if it is switched on/off [settings]', () => {
    let consoleChain = new ConsoleLink({ CONSOLE_LOGGING: true });
    assert.equal(consoleChain.isEnabled(), true);
    consoleChain = new ConsoleLink({ CONSOLE_LOGGING: false });
    assert.equal(consoleChain.isEnabled(), false);
    consoleChain = new ConsoleLink({});
    // should be enabled by default
    assert.equal(consoleChain.isEnabled(), true);
  });

  it('should indicate if it is switched on/off [envs]', () => {
    const consoleChain = new ConsoleLink({});
    assert.equal(consoleChain.isEnabled(), true);
    process.env.CONSOLE_LOGGING = true;
    assert.equal(consoleChain.isEnabled(), true);
    process.env.CONSOLE_LOGGING = false;
    assert.equal(consoleChain.isEnabled(), false);
  });

  it('should indicate if it is switched on/off [envs should have more privilege]', () => {
    const consoleChain = new ConsoleLink({ CONSOLE_LOGGING: true });
    assert.equal(consoleChain.isEnabled(), true);
    process.env.CONSOLE_LOGGING = false;
    assert.equal(consoleChain.isEnabled(), false);
    process.env.CONSOLE_LOGGING = undefined;
    assert.equal(consoleChain.isEnabled(), true);
  });

  it('should not break down if null is logged', () => {
    const consoleChain = new ConsoleLink({ CONSOLE_LOGGING: 'true' });
    consoleChain.handle(null);
  });

  it('should log message if CONSOLE_LOGGING = true', () => {
    const consoleChain = new ConsoleLink({ CONSOLE_LOGGING: 'true' });
    const spy = sinon.spy(consoleChain.winston.log);
    consoleChain.winston.log = spy;
    const message = new Message();
    consoleChain.handle(message);
    assert(spy.called);
  });

  it('should not log message if CONSOLE_LOGGING = false', () => {
    const consoleChain = new ConsoleLink({ CONSOLE_LOGGING: 'false' });
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
    });
    const spy = sinon.spy(consoleChain.winston.log);
    consoleChain.winston.log = spy;
    const message = new Message();
    consoleChain.handle(message);
    assert(!spy.called);
  });

  it('should not log if message level < MIN_LOG_LEVEL [envs]', () => {
    const consoleChain = new ConsoleLink({ CONSOLE_LOGGING: 'true' });
    const spy = sinon.spy(consoleChain.winston.log);
    consoleChain.winston.log = spy;
    const message = new Message();
    process.env.MIN_LOG_LEVEL = 'error';
    consoleChain.handle(message);
    assert(!spy.called);
  });

  it('should log if message level >= MIN_LOG_LEVEL_CONSOLE but < MIN_LOG_LEVEL [envs]', () => {
    const consoleChain = new ConsoleLink({ CONSOLE_LOGGING: 'true' });
    const spy = sinon.spy(consoleChain.winston.log);
    consoleChain.winston.log = spy;
    const message = new Message('warn');
    process.env.MIN_LOG_LEVEL = 'error';
    process.env.MIN_LOG_LEVEL_CONSOLE = 'warn';
    consoleChain.handle(message);
    assert(spy.called);
  });

  it('should log if message level = MIN_LOG_LEVEL [envs]', () => {
    const consoleChain = new ConsoleLink({ CONSOLE_LOGGING: 'true' });
    const spy = sinon.spy(consoleChain.winston.log);
    consoleChain.winston.log = spy;
    const message = new Message('error');
    process.env.MIN_LOG_LEVEL = 'error';
    consoleChain.handle(message);
    assert(spy.called);
  });

  it('should log if message level > MIN_LOG_LEVEL [envs]', () => {
    const consoleChain = new ConsoleLink({ CONSOLE_LOGGING: 'true' });
    const spy = sinon.spy(consoleChain.winston.log);
    consoleChain.winston.log = spy;
    const message = new Message('error');
    process.env.MIN_LOG_LEVEL = 'warn';
    consoleChain.handle(message);
    assert(spy.called);
  });

  it('should jsonify message metadata if configured [envs]', () => {
    process.env.JSONIFY = 'true';
    const consoleLink = new ConsoleLink({ CONSOLE_LOGGING: 'true', JSONIFY: false });
    const message = new Message('error', 'Message', { hello: 'world', to: { who: 'to you' }, error: new Error() });
    const spy = sinon.spy(message, 'jsonifyMetadata');
    consoleLink.handle(message);
    assert(spy.called);
  });

  it('should jsonify message metadata if configured [settings]', () => {
    const consoleLink = new ConsoleLink({ CONSOLE_LOGGING: 'true', JSONIFY: true });
    const message = new Message('error', 'Message', { hello: 'world', to: { who: 'to you' } });
    const spy = sinon.spy(message, 'jsonifyMetadata');
    consoleLink.handle(message);
    assert(spy.called);
  });
});
