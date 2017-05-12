const assert = require('assert');

/**
  @class Winston
  Adapter for the winston logger chain link.
  Exposes logger's main functions as if a standard winston module was used
  The list of functions:
  @function info - log message with an info log level
  @function warn - log message with an warn log level
  @function error - log message with an error log level
  @function debug - log message with a debug log level
  @function silly - log message with a silly log level
  @function verbose - log message with a verbose log level
  @function log - log message with a provided log level
  @function profile - profiling function
  @constructor consumes the instance of a LoggerChain @class
**/
class Winston {
  /**
    @constructor
    Construct the instance of a winston adapter
    Create main logging functions
    Each function has the following arguments:
    @param message {string|Error} - a message / error to log
    @param args {Object} - message metadata
  **/
  constructor(chain, chainLinkIndex = -1) {
    assert(chain);
    this.chain = chain;
    this.chainLinkIndex = chainLinkIndex;
    const loggingLevels = ['error', 'warn', 'info', 'debug', 'silly', 'verbose'];
    for (const loggingLevel of loggingLevels) {
      this[loggingLevel] = (message, ...args) => {
        this.chain.log(loggingLevel, message, ...args);
      };
    }
  }

  /**
    @function log
    Log a message with the provided log level and metadata
    @param logLevel {string} - one of the supported log levels:
    - info
    - warn
    - error
    - debug
    - silly
    - verbose
    @param message {string|Error} - message / Error to log
    @param args {Object} - message metadata
  **/
  log(logLevel, message, ...args) {
    this.chain.log(logLevel, message, ...args);
  }

  /**
    @function profile
    Fire a winston's implementation of a profiling function
    @param message {string} - a unique profiling label
  **/
  profile(label) {
    const winston = this.chain.chainLinks[this.chainLinkIndex].winston;
    winston.profile(label);
  }
}

module.exports = Winston;
