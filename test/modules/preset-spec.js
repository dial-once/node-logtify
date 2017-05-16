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
  });

  it('should return a piece of a config object [prefix]', () => {
    const result = preset({ presets: ['prefix'] });
    assert(result);
    assert(typeof result === 'object');
    assert.equal(result.LOG_TIMESTAMP, true);
    assert.equal(result.LOG_ENVIRONMENT, true);
    assert.equal(result.LOG_LEVEL, true);
    assert.equal(result.LOG_REQID, true);
  });

  it('should return a piece of a config object [dial-once]', () => {
    const result = preset({ something: 'else', presets: ['dial-once'] });
    assert(result);
    assert(typeof result === 'object');
    assert.equal(result.chainLinks.length, 2);
    assert.equal(result.chainLinks[0].config.something, 'else');
  });
});
