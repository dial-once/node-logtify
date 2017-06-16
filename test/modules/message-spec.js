const assert = require('assert');
const Message = require('../../src/modules/message');

describe('Message class test', () => {
  describe('packMessage() ', () => {
    it('should convert null message to default', () => {
      const message = new Message(null, null);
      assert(message);
      assert(message.payload);
      assert.equal(message.payload.level, 'info');
      assert.equal(message.payload.text, '');
      assert.equal(message.payload.meta.instanceId, process.env.HOSTNAME);
    });

    it('should convert undefined message to default', () => {
      const message = new Message(undefined, undefined);
      assert(message);
      assert(message.payload);
      assert.equal(message.payload.level, 'info');
      assert.equal(message.payload.text, '');
      assert.equal(message.payload.meta.instanceId, process.env.HOSTNAME);
    });

    it('should process message text [string]', () => {
      const message = new Message(null, 'Hello world');
      assert(message);
      assert(message.payload);
      assert.equal(message.payload.level, 'info');
      assert.equal(message.payload.text, 'Hello world');
      assert.equal(message.payload.meta.instanceId, process.env.HOSTNAME);
    });

    it('should process message as error [Error]', () => {
      const error = new Error('Hell world');
      const message = new Message(null, error);
      assert(message);
      assert(message.payload);
      assert.equal(message.payload.level, 'info');
      assert.equal(message.payload.text, error.message);
      assert.equal(message.payload.meta.stack, error.stack);
      assert.equal(message.payload.meta.notify, true);
      assert.equal(message.payload.meta.instanceId, process.env.HOSTNAME);
      assert(message.payload.error instanceof Error);
    });

    it('should set log level to default if non given [env]', () => {
      const message = new Message(null, 'Hello world');
      assert(message);
      assert(message.payload);
      assert.equal(message.payload.level, 'info');
    });

    it('should set log level to given', () => {
      const message = new Message('silly', 'Hello world');
      assert(message);
      assert(message.payload);
      assert.equal(message.payload.level, 'silly');
    });

    it('should overwrite existing metas with given [string]', () => {
      const message = new Message(null, 'Hello world', {
        extra: 'data'
      });
      assert(message);
      assert(message.payload);
      assert.equal(message.payload.meta.extra, 'data');
    });

    it('should overwrite existing metas with given [error]', () => {
      const error = new Error('Hell world');
      const message = new Message(null, error, {
        notify: false
      }, {
        something: 'else'
      });
      assert(message);
      assert(message.payload);
      assert.equal(message.payload.meta.notify, false);
      assert.equal(message.payload.meta.something, 'else');
    });
  });
  describe('getPrefix() ', () => {
    before(() => {
      this.emptyPrefix = { timestamp: '', environment: '', logLevel: '', reqId: '', isEmpty: true };
    });

    beforeEach(() => {
      delete process.env.LOG_TIMESTAMP;
      delete process.env.LOG_ENVIRONMENT;
      delete process.env.LOG_LEVEL;
      delete process.env.LOG_REQID;
    });

    afterEach(() => {
      delete process.env.LOG_TIMESTAMP;
      delete process.env.LOG_ENVIRONMENT;
      delete process.env.LOG_LEVEL;
      delete process.env.LOG_REQID;
    });

    it('should return empty string if no envs provided', () => {
      const message = new Message();
      const prefix = message.getPrefix();
      assert.deepEqual(prefix, this.emptyPrefix);
    });

    it('should return data according to settings [with env]timestamp]', () => {
      const message = new Message();
      process.env.LOG_TIMESTAMP = 'false';
      const prefix = message.getPrefix();
      assert.deepEqual(prefix, this.emptyPrefix);
    });

    it('should return data according to settings [with env]timestamp]', () => {
      const message = new Message();
      process.env.LOG_TIMESTAMP = 'true';
      const prefix = message.getPrefix();
      assert.notDeepEqual(prefix, this.emptyPrefix);
    });

    it('should return data according to settings [with env] [environment]', () => {
      const message = new Message();
      process.env.LOG_ENVIRONMENT = 'false';
      const prefix = message.getPrefix();
      assert.deepEqual(prefix, this.emptyPrefix);
    });

    it('should return data according to settings [with env] [environment]', () => {
      const message = new Message();
      process.env.LOG_ENVIRONMENT = 'true';
      const prefix = message.getPrefix();
      const environment = process.env.NODE_ENV === 'undefined' ? 'local' : process.env.NODE_ENV;
      const notEmptyPrefix = Object.assign({}, this.emptyPrefix, { environment: `${environment}:`, isEmpty: false });
      assert.deepEqual(prefix, notEmptyPrefix);
    });

    it('should return data according to settings [with env] [log level]', () => {
      const message = new Message();
      process.env.LOG_LEVEL = 'false';
      const prefix = message.getPrefix();
      assert.deepEqual(prefix, this.emptyPrefix);
    });

    it('should return data according to settings [with env] [log level]', () => {
      const message = new Message();
      process.env.LOG_LEVEL = 'true';
      const prefix = message.getPrefix();
      const notEmptyPrefix = Object.assign({}, this.emptyPrefix, { logLevel: 'INFO:', isEmpty: false });
      assert.deepEqual(prefix, notEmptyPrefix);
    });

    it('should return data according to settings [with env] [reqId] [not provided]', () => {
      const message = new Message();
      process.env.LOG_REQID = 'false';
      const prefix = message.getPrefix();
      assert.deepEqual(prefix, this.emptyPrefix);
    });

    it('should return data according to settings [with env] [reqId] [not provided]', () => {
      const message = new Message();
      process.env.LOG_REQID = 'true';
      const prefix = message.getPrefix();
      assert.deepEqual(prefix, this.emptyPrefix);
    });

    it('should return data according to settings [with env] [reqId] [provided]', () => {
      const message = new Message(null, 'Hello world', {
        reqId: 'test'
      });
      process.env.LOG_REQID = 'false';
      const prefix = message.getPrefix();
      assert.deepEqual(prefix, this.emptyPrefix);
    });

    it('should return data according to settings [with env] [reqId] [provided]', () => {
      const message = new Message(null, 'Hello world', {
        reqId: 'test'
      });
      process.env.LOG_REQID = 'true';
      const prefix = message.getPrefix();
      const notEmptyPrefix = Object.assign({}, this.emptyPrefix, { reqId: 'test', isEmpty: false });
      assert.deepEqual(prefix, notEmptyPrefix);
    });

    it('should return data according to settings [settings]timestamp]', () => {
      const message = new Message();
      const prefix = message.getPrefix({ LOG_TIMESTAMP: false });
      assert.deepEqual(prefix, this.emptyPrefix);
    });

    it('should return data according to settings [settings]timestamp]', () => {
      const message = new Message();
      const prefix = message.getPrefix({ LOG_TIMESTAMP: true });
      assert.notDeepEqual(prefix, this.emptyPrefix);
    });

    it('should return data according to settings [settings] [environment]', () => {
      const message = new Message();
      const prefix = message.getPrefix({ LOG_ENVIRONMENT: false });
      assert.deepEqual(prefix, this.emptyPrefix);
    });

    it('should return data according to settings [settings] [environment]', () => {
      const message = new Message();
      const prefix = message.getPrefix({ LOG_ENVIRONMENT: true });
      const environment = process.env.NODE_ENV === 'undefined' ? 'local' : process.env.NODE_ENV;
      const notEmptyPrefix = Object.assign({}, this.emptyPrefix, { environment: `${environment}:`, isEmpty: false });
      assert.deepEqual(prefix, notEmptyPrefix);
    });

    it('should return data according to settings [settings] [log level]', () => {
      const message = new Message();
      const prefix = message.getPrefix({ LOG_LEVEL: false });
      assert.deepEqual(prefix, this.emptyPrefix);
    });

    it('should return data according to settings [settings] [log level]', () => {
      const message = new Message();
      const prefix = message.getPrefix({ LOG_LEVEL: true });
      const notEmptyPrefix = Object.assign({}, this.emptyPrefix, { logLevel: 'INFO:', isEmpty: false });
      assert.deepEqual(prefix, notEmptyPrefix);
    });

    it('should return data according to settings [settings] [reqId] [not provided]', () => {
      const message = new Message();
      const prefix = message.getPrefix({ LOG_REQID: false });
      assert.deepEqual(prefix, this.emptyPrefix);
    });

    it('should return data according to settings [settings] [reqId] [not provided]', () => {
      const message = new Message();
      const prefix = message.getPrefix({ LOG_REQID: true });
      assert.deepEqual(prefix, this.emptyPrefix);
    });

    it('should return data according to settings [settings] [reqId] [provided]', () => {
      const message = new Message(null, 'Hello world', {
        reqId: 'test'
      });
      const prefix = message.getPrefix({ LOG_REQID: false });
      assert.deepEqual(prefix, this.emptyPrefix);
    });

    it('should return data according to settings [settings] [reqId] [provided]', () => {
      const message = new Message(null, 'Hello world', {
        reqId: 'test'
      });
      const prefix = message.getPrefix({ LOG_REQID: true });
      const notEmptyPrefix = Object.assign({}, this.emptyPrefix, { reqId: 'test', isEmpty: false });
      assert.deepEqual(prefix, notEmptyPrefix);
    });

    it('should be able to change the delimiter', () => {
      const message = new Message(null, 'Hello world');
      const prefix = message.getPrefix({ LOG_ENVIRONMENT: true }, '*');
      const environment = process.env.NODE_ENV === 'undefined' ? 'local' : process.env.NODE_ENV;
      const notEmptyPrefix = Object.assign({}, this.emptyPrefix, { environment: `${environment}*`, isEmpty: false });
      assert.deepEqual(prefix, notEmptyPrefix);
    });
  });
});
