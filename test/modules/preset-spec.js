const packageJSON = require('../../package.json');
const path = require('path');
const preset = require('../../src/modules/presets');
const assert = require('assert');

describe('Presets', () => {
  it('should return empty object if no presets provided / unsupported preset', () => {
    function compare(obj) {
      assert(obj);
      assert(typeof obj === 'object');
      assert.deepEqual(obj, {});
    }
    let result = preset({ presets: [] });
    compare(result);
    result = preset({ presets: ['weird'] });
    compare(result);
  });

  it('should return a piece of a config object [no-prefix]', () => {
    const result = preset({ presets: ['no-prefix'] });
    assert(result);
    assert(typeof result === 'object');
    assert.equal(result.LOG_TIMESTAMP, false);
    assert.equal(result.LOG_ENVIRONMENT, false);
    assert.equal(result.LOG_LEVEL, false);
    assert.equal(result.LOG_REQID, false);
    assert.equal(result.LOG_CALLER_PREFIX, false);
  });

  it('should return a piece of a config object [prefix]', () => {
    const result = preset({ presets: ['prefix'] });
    assert(result);
    assert(typeof result === 'object');
    assert.equal(result.LOG_TIMESTAMP, true);
    assert.equal(result.LOG_ENVIRONMENT, true);
    assert.equal(result.LOG_LEVEL, true);
    assert.equal(result.LOG_REQID, true);
    assert.equal(result.LOG_CALLER_PREFIX, true);
  });

  it('should return a piece of a config object [dial-once]', () => {
    const result = preset({ presets: ['dial-once'] });
    assert(result);
    assert.equal(result.CONSOLE_LOGGING, true);
    assert.equal(result.LOGSTASH_LOGGING, false);
    assert.equal(result.LOGENTRIES_LOGGING, false);
    assert.equal(result.BUGSNAG_LOGGING, false);
    assert.equal(result.JSONIFY, true);
    assert.equal(result.BUGSNAG_APP_VERSION, 'unknown');
  });

  it('should return a piece of config object [jsonify]', () => {
    const result = preset({ presets: ['jsonify'] });
    assert(result);
    assert.equal(result.JSONIFY, true);
  });

  it('should return correct app version', () => {
    const projectRoot = path.posix.resolve(__dirname, '../../');
    const appVersion = preset.getCallerAppVersion(path.normalize(`${projectRoot}/node_modules/node-logtify`));
    assert.equal(packageJSON.version, appVersion);
  });
});
