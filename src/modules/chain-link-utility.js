const deepFreeze = require('deep-freeze');
/**
  @class ChainLinkUtility
  A basic interface based on the Chain of Resp Pattern
  Contains common functions, used by chain links implementations
**/
class ChainLinkUtility {
  /**
    @constructor
    Construct an instance of a ChainLink class
    @param configs {Object} - chain configuration. Falls back to {} if not provided
    @param nextChainLink {Object} - optional next link object in the chain
    An instance contains a logLevels Map - an object, where a key is a log level and a value is it's priority
    - silly -> 0
    - verbose -> 1
    - debug -> 2
    - info -> 3
    - warn -> 4
    - error -> 5
    In case a typo is done, falls back to a DEFAULT_LOG_LEVEL env or settings parameter or if not provided,
    falls back to 'info' as a default log level
  **/
  constructor() {
    const levels = [
      ['silly', 0],
      ['verbose', 1],
      ['debug', 2],
      ['info', 3],
      ['warn', 4],
      ['error', 5],
      ['default', 'info']
    ];
    this.logLevels = deepFreeze(new Map(levels));
  }

  /**
    @function getMinLogLevel
    Check the env vars and settings object for a provided min log level in general or for a separate chain
    @param config {object} - a chain link configuration object
    @param chain {string} - an identifier of a chain to check the config for
    Chain - specific config has a higher priority over a general config
    Hence, for example, if a chain has a name X, then MIN_LOG_LEVEL_X will have a higher priority over a MIN_LOG_LEVEL
    @return {string} - a min log level provided in the setup (env or settings object param)
  **/
  getMinLogLevel(config, chain = '') {
    const settings = config || {};
    const minLogLevel = process.env[`MIN_LOG_LEVEL_${chain}`] || settings[`MIN_LOG_LEVEL_${chain}`] ||
      process.env.MIN_LOG_LEVEL || settings.MIN_LOG_LEVEL;
    if (!this.logLevels.has(minLogLevel)) {
      return this.logLevels.get('default');
    }
    return minLogLevel;
  }
}

module.exports = ChainLinkUtility;
