
describe('entry point', () => {
  it('should load the entry point without error', () => {
    /* eslint-disable global-require */
    require('../src/index');

    return Promise.resolve();
  });
});
