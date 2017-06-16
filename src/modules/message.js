const deepFreeze = require('deep-freeze');
/**
  @class Message
  Convert the given parameters into a frozen (@see Object.deepFreeze()) message package
  @param logLevel {string} - a message log level (@see ChainLink @class for additional info)
  @param message {Object|Error} - a message payload. Either a text string or an Error object
  @param metas {Object} - metadata
**/
class Message {
  constructor(logLevel, message, ...metas) {
    // if plain text
    this.payload = {
      level: logLevel || 'info',
      text: message || '',
      meta: {
        instanceId: process.env.HOSTNAME,
        notify: true
      }
    };

    // if error
    if (message instanceof Error) {
      this.payload.text = message.message || 'Error: ';
      this.payload.meta.stack = message.stack;
      this.payload.error = message;
    }
    // all metas are included as message meta
    if (metas.length > 0) {
      const metaData = metas.reduce((sum, next) => Object.assign({}, sum, next));
      Object.assign(this.payload.meta, metaData);
    }
    this.payload = deepFreeze(this.payload);
    this.prefix = null;
  }

  /**
    @function getPrefix
    Create a prefix for a message based on which prefix data is enabled for logging
    Configuration:
    - LOG_TIMESTAMP {'true'|'false'} - include timestamp ISO string into a message prefix
    - LOG_ENVIRONMENT {'true'|'false'} - include current environment into a message prefix
    - LOG_LEVEL {'true'|'false'} - include log level in UPPERCASE into a message prefix
    - LOG_REQID {'true'|'false'} - incldue a reqId into a message prefix

    reqId will be included only if provided in the message meta

    @param settings {Object} - chain settings. Falls back to {} if not given
    @param delimiter {string} - a character to split prefix parts. Falls back to ':'
    @return {string} - Prefix for the log message. Or an empty string of no prefix data logging is enabled
  **/
  getPrefix(settings = {}, delimiter = ':') {
    if (this.prefix === null) {
      const message = this.payload;
      const includeTimestamp = process.env.LOG_TIMESTAMP === 'true' || !!settings.LOG_TIMESTAMP;
      const includeEnvironment = process.env.LOG_ENVIRONMENT === 'true' || !!settings.LOG_ENVIRONMENT;
      const includeLogLevel = process.env.LOG_LEVEL === 'true' || !!settings.LOG_LEVEL;
      const environment = process.env.NODE_ENV === 'undefined' ? 'local' : process.env.NODE_ENV;
      this.prefix = {
        timestamp: includeTimestamp ? `${new Date().toISOString()}${delimiter}` : '',
        environment: includeEnvironment ? `${environment}${delimiter}` : '',
        logLevel: includeLogLevel ? `${message.level.toUpperCase()}${delimiter}` : '',
        reqId: ''
      };
      if (message.meta.reqId) {
        const includeReqId = process.env.LOG_REQID === 'true' || !!settings.LOG_REQID;
        this.prefix.reqId = includeReqId ? `${message.meta.reqId}` : '';
      }
      let isEmpty = true;
      for (const key in this.prefix) { // eslint-disable-line
        if (this.prefix[key] !== '') {
          isEmpty = false;
          break;
        }
      }
      this.prefix.isEmpty = isEmpty;
    }
    return this.prefix;
  }
}

module.exports = Message;
