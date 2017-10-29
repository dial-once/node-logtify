require('../../src/env.js');
const assert = require('assert');
const Message = require('../../src/modules/message');
const serializeError = require('serialize-error');

describe('Message class test', () => {
  describe('Message constructor', () => {
    it('should convert null message to default', () => {
      const message = new Message(null, null);
      assert(message);
      assert(message.payload);
      assert.equal(message.payload.level, 'info');
      assert.equal(message.payload.text, null);
      assert.equal(message.payload.meta.instanceId, process.env.HOSTNAME);
    });

    it('should convert undefined message to default', () => {
      const message = new Message(undefined, undefined);
      assert(message);
      assert(message.payload);
      assert.equal(message.payload.level, 'info');
      assert.equal(message.payload.text, undefined);
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
      const error = new Error('Hello world');
      const message = new Message(null, error);
      assert(message);
      assert(message.payload);
      assert.equal(message.payload.level, 'info');
      assert.equal(message.payload.text, JSON.stringify(serializeError(error)));
      assert(message.payload.meta.error instanceof Error);
      assert.equal(message.payload.meta.error.stack, error.stack);
      assert.equal(message.payload.meta.instanceId, process.env.HOSTNAME);
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
      const error = new Error('Hello world');
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

    it('should convert errors in metadata appropriately [object]', () => {
      const error = new Error('Hello world');
      const message = new Message(null, 'Warning', { error });
      assert(message);
      assert(message.payload);
      assert(message.payload.meta.error instanceof Error);
      assert.equal(message.payload.text, 'Warning');
      assert.equal(message.payload.meta.error.message, error.message);
      assert(message.payload.meta.error.stack);
    });

    it('should convert errors in metadata [raw error]', () => {
      const error = new Error('Hello world');
      const message = new Message(null, 'Warning', error);
      assert(message);
      assert(message.payload);
      assert(message.payload.meta.error instanceof Error);
      assert.equal(message.payload.text, 'Warning');
      assert.equal(message.payload.meta.error.message, error.message);
      assert(message.payload.meta.error.stack);
    });

    it('should jsonify objects as message', () => {
      const object = {
        hello: 'world',
        one: {
          two: 2
        },
        error: new Error()
      };
      const message = new Message(null, object);
      const expectedObject = Object.assign({}, object, { error: serializeError(object.error) });
      assert.equal(message.payload.text, JSON.stringify(expectedObject));
    });

    it('should jsonify arrays as message', () => {
      const object = [
        'hello world',
        { one: { two: 2 } },
        new Error()
      ];
      const message = new Message(null, object);
      const expectedObject = ['hello world', { one: { two: 2 } }, serializeError(object[object.length - 1])];
      assert.equal(message.payload.text, JSON.stringify(expectedObject));
    });

    it('should jsonify error as a message', () => {
      const error = new Error();
      const message = new Message(null, error);
      assert.equal(message.payload.text, JSON.stringify(serializeError(error)));
    });
  });

  describe('handleMetadata()', () => {
    before(() => {
      this.handleMetadata = new Message().handleMetadata;
    });

    it('should not process arrays', () => {
      assert.deepEqual(this.handleMetadata(['one', 'two', 'three']), {});
    });

    it('should not convert primitives', () => {
      const str = 'hello';
      const num = 123213421;
      const bool = true;
      assert.equal(this.handleMetadata(str), str);
      assert.equal(this.handleMetadata(num), num);
      assert.equal(this.handleMetadata(bool), bool);
    });

    it('should not change object structure', () => {
      const obj = {
        one: 1,
        two: 2,
        three: {
          one: 'one',
          two: 'two',
          three: 'three'
        }
      };
      assert.deepEqual(this.handleMetadata(obj), obj);
    });

    it('should convert error to object', () => {
      const error = new Error();
      assert.deepEqual(this.handleMetadata(error), { error });
    });
  });

  describe('getPrefix()', () => {
    before(() => {
      this.emptyPrefix = { timestamp: '', environment: '', logLevel: '', reqId: '', isEmpty: true };
    });

    beforeEach(() => {
      delete process.env.LOG_TIMESTAMP;
      delete process.env.LOG_ENVIRONMENT;
      delete process.env.LOG_LEVEL;
      delete process.env.LOG_REQID;
      delete process.env.LOG_CALLER_PREFIX;
    });

    afterEach(() => {
      delete process.env.LOG_TIMESTAMP;
      delete process.env.LOG_ENVIRONMENT;
      delete process.env.LOG_LEVEL;
      delete process.env.LOG_REQID;
      delete process.env.LOG_CALLER_PREFIX;
    });

    it('should return empty string if no envs provided', () => {
      const message = new Message();
      const prefix = message.getPrefix();
      assert.deepEqual(prefix, this.emptyPrefix);
    });

    it('should return data according to settings [with env] [timestamp]', () => {
      const message = new Message();
      process.env.LOG_TIMESTAMP = 'false';
      const prefix = message.getPrefix();
      assert.deepEqual(prefix, this.emptyPrefix);
    });

    it('should return data according to settings [with env] [timestamp]', () => {
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
      const environment = process.env.NODE_ENV && process.env.NODE_ENV !== 'undefined' ? process.env.NODE_ENV : 'local';
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

    it('should return data according to settings [with env] [log caller prefix] [disabled]', () => {
      const message = new Message();
      const prefix = message.getPrefix();
      assert(!{}.hasOwnProperty.call(prefix, 'module'));
      assert(!{}.hasOwnProperty.call(prefix, 'function'));
      assert(!{}.hasOwnProperty.call(prefix, 'project'));
    });

    it('should return data according to settings [with env] [log caller prefix] [enabled]', () => {
      const message = new Message();
      process.env.LOG_CALLER_PREFIX = 'true';
      const prefix = message.getPrefix();
      assert({}.hasOwnProperty.call(prefix, 'module'));
      assert({}.hasOwnProperty.call(prefix, 'function'));
      assert({}.hasOwnProperty.call(prefix, 'project'));
    });

    it('should return data according to settings [settings] [timestamp]', () => {
      const message = new Message();
      const prefix = message.getPrefix({ LOG_TIMESTAMP: false });
      assert.deepEqual(prefix, this.emptyPrefix);
    });

    it('should return data according to settings [settings] [timestamp]', () => {
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
      const environment = process.env.NODE_ENV && process.env.NODE_ENV !== 'undefined' ? process.env.NODE_ENV : 'local';
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
      const message = new Message(null, 'Hello world', { reqId: 'test' });
      const prefix = message.getPrefix({ LOG_REQID: true });
      const notEmptyPrefix = Object.assign({}, this.emptyPrefix, { reqId: 'test', isEmpty: false });
      assert.deepEqual(prefix, notEmptyPrefix);
    });

    it('should return data according to settings [settings] [log caller prefix] [disabled]', () => {
      const message = new Message();
      const prefix = message.getPrefix({ LOG_CALLER_PREFIX: false });
      assert(!{}.hasOwnProperty.call(prefix, 'module'));
      assert(!{}.hasOwnProperty.call(prefix, 'function'));
      assert(!{}.hasOwnProperty.call(prefix, 'project'));
    });

    it('should return data according to settings [settings] [log caller prefix] [enabled]', () => {
      const message = new Message();
      const prefix = message.getPrefix({ LOG_CALLER_PREFIX: true });
      assert({}.hasOwnProperty.call(prefix, 'module'));
      assert({}.hasOwnProperty.call(prefix, 'function'));
      assert({}.hasOwnProperty.call(prefix, 'project'));
    });

    it('should use env prior to settings [env and settings] [log caller prefix] [enabled]', () => {
      const message = new Message();
      process.env.LOG_CALLER_PREFIX = 'true';
      const prefix = message.getPrefix({ LOG_CALLER_PREFIX: false });
      assert({}.hasOwnProperty.call(prefix, 'module'));
      assert({}.hasOwnProperty.call(prefix, 'function'));
      assert({}.hasOwnProperty.call(prefix, 'project'));
    });

    it('should use env prior to settings [env and settings] [log caller prefix] [disabled]', () => {
      const message = new Message();
      process.env.LOG_CALLER_PREFIX = 'false';
      const prefix = message.getPrefix({ LOG_CALLER_PREFIX: true });
      assert(!{}.hasOwnProperty.call(prefix, 'module'));
      assert(!{}.hasOwnProperty.call(prefix, 'function'));
      assert(!{}.hasOwnProperty.call(prefix, 'project'));
    });

    it('should be able to change the delimiter', () => {
      const message = new Message(null, 'Hello world');
      const prefix = message.getPrefix({ LOG_ENVIRONMENT: true }, '*');
      const environment = process.env.NODE_ENV && process.env.NODE_ENV !== 'undefined' ? process.env.NODE_ENV : 'local';
      const notEmptyPrefix = Object.assign({}, this.emptyPrefix, { environment: `${environment}*`, isEmpty: false });
      assert.deepEqual(prefix, notEmptyPrefix);
    });
  });
});
