const assert = require('assert');
const Tracer = require('../../src/modules/tracer.js');

describe('tracer module', () => {
  it('should collect data about caller project', () => {
    const response = Tracer.trace();
    assert(response);
    // these will contain data about mocha module that called executed the test
    assert(response.module);
    assert(response.function);
    // no parent project
    assert.equal(response.project, '');
  });
});
