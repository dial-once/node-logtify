const assert = require('assert');

const modulePath = '../src/env';

/* eslint-disable global-require, import/no-dynamic-require */
describe('env checks', () => {
  const prevHostname = process.env.HOSTNAME;
  const prevUser = process.env.USER;

  afterEach(() => {
    delete require.cache[require.resolve(modulePath)];
    process.env.HOSTNAME = prevHostname;
    process.env.USER = prevUser;
    process.env.CONSOLE_LOGGING = '';
  });

  beforeEach(() => {
    delete require.cache[require.resolve(modulePath)];
  });

  it('should take USER env var if HOSTNAME is undefined', () => {
    process.env.HOSTNAME = '';
    process.env.USER = 'user';

    require(modulePath);

    assert.equal(process.env.HOSTNAME, 'user');
  });

  it('should NOT take USER env var if HOSTNAME is defined', () => {
    process.env.HOSTNAME = 'test';
    process.env.USER = 'user';
    require(modulePath);

    assert.equal(process.env.HOSTNAME, 'test');
  });

  it('should take instance ID if HOSTNAME is defined with docker cloud format', () => {
    process.env.HOSTNAME = 'instance-3';

    require(modulePath);

    assert.equal(process.env.INSTANCE_NUMBER, '3');
  });

  it('should set CONSOLE_LOGGING to false if NODE_ENV is production', () => {
    process.env.NODE_ENV = 'production';

    require(modulePath);

    assert.equal(process.env.CONSOLE_LOGGING, '');
  });

  it('should not set CONSOLE_LOGGING to true if NODE_ENV is not production', () => {
    process.env.NODE_ENV = 'test';
    process.env.CONSOLE_LOGGING = '';

    require(modulePath);

    assert.equal(process.env.CONSOLE_LOGGING, 'true');
  });
});
