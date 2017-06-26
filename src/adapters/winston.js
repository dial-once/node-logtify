const assert = require('assert');

function loggingFunction(stream, loggingLevel) {
  return (message, ...args) => {
    stream.log(loggingLevel, message, ...args);
  };
}
/**
  @class Winston
  Adapter for the winston logger subscriber.
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
  @constructor consumes the instance of a LoggerStream @class
**/
class Winston {
  /**
    @constructor
    Construct the instance of a winston adapter
    Create main logging functions
    Each function has the following arguments:
    @param stream {object} - an instance of a stream
    @param subscriber {object} - instance of a subscriber
  **/
  constructor(stream, subscriber) {
    assert(stream);
    this.stream = stream;
    this.winston = subscriber.winston;
    const loggingLevels = ['error', 'warn', 'info', 'debug', 'silly', 'verbose'];
    for (const loggingLevel of loggingLevels) {
      this[loggingLevel] = loggingFunction(this.stream, loggingLevel);
    }
  }

  /**
    @function log
    Log a message with the provided log level and metadatas
    @param logLevel {string} - one of the supported log levels:
    - info
    - warn
    - error
    - debug
    - silly
    - verbose
    @param message {string|Error} - message / Error to log
    @param args {Object} - message metadatas
  **/
  log(logLevel, message, ...args) {
    this.stream.log(logLevel, message, ...args);
  }

  /**
    @function profile
    Fire a winston's implementation of a profiling function
    @param label {string} - a unique profiling label
  **/
  profile(label) {
    this.winston.profile(label);
  }
}

module.exports = Winston;
