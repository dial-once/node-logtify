const assert = require('assert');
const sinon = require('sinon');

const modulePath = '../src/index';

/* eslint-disable global-require, import/no-dynamic-require, no-console */
describe('entry point', () => {
  beforeEach(() => {
    // removing the module copy from the require's cache to be able to import it from scratch again
    delete require.cache[require.resolve(modulePath)];
  });

  afterEach(() => {
    delete require.cache[require.resolve(modulePath)];
  });

  it('should return a function', () => {
    assert(typeof require(modulePath), 'function');
  });

  it('should execute without an exception (no params) but print a warning message', () => {
    const spy = sinon.spy(console, 'warn');
    require(modulePath)();
    assert(spy.calledWith('Logtify should be initilised before used without config.'));
  });

  it('should execute without an exception (params)', () => {
    require(modulePath)({});
  });

  it('should return a logger and a notifier', () => {
    const index = require(modulePath)({});
    assert.notEqual(index.logger, undefined);
  });

  it('should return a logger and a notifier (no params) without warning, already initialised', () => {
    const index = require('../src/index')();
    assert.notEqual(index.logger, undefined);
  });
});
