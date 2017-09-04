const tracer = require('./tracer.js');

/**
  @class Message
  Convert the given parameters into a correct message format
  @param logLevel {string} - a message log level (@see Subscriber @class for additional info)
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
        instanceId: process.env.HOSTNAME
      }
    };

    // if error
    if (message instanceof Error) {
      this.payload.text = message.message || 'Error: ';
      Object.assign(this.payload.meta, { error: message });
    }
    // all metas are included as message meta
    if (metas.length > 0) {
      // reduce does not process 1st element, but automatically includes it as [sum]
      if (metas[0] instanceof Error) {
        metas[0] = { error: metas[0] }; // eslint-disable-line no-param-reassign
      }
      const metaData = metas.reduce((sum, next) => Object.assign({}, sum, this.handleMetadata(next)));
      Object.assign(this.payload.meta, metaData);
    }
    this.callerModuleInfo = tracer.trace();
  }

  /**
   * Convert metadata to correct form based on type
   * @param  {any} metadata  - values/objects/arrays to be used as metadata
   * @return {Object|string|number|boolean}        - metadata, converted to object or primitive
   */
  handleMetadata(metadata) {
    // if privimite value
    if (['number', 'string', 'boolean'].includes(typeof metadata)) {
      return metadata;
    }

    const result = {};
    // do not support Arrays in metadata
    if ([null, undefined].includes(metadata) || Array.isArray(metadata)) {
      return result;
    }

    if (metadata instanceof Error) {
      Object.assign(result, { error: metadata });
    } else if (typeof metadata === 'object') {
      Object.assign(result, metadata);
    }
    return result;
  }

  /**
   * Check if a prefix option is enabled by env variable/settings
   * @param  {Object} settings   - logger settings
   * @param  {string} prefixPart - name of the prefix part
   * @return {boolean}           - true/false in case enabled/disabled
   */
  shouldInclude(settings, prefixPart) {
    return process.env[prefixPart] ? process.env[prefixPart] === 'true' : !!settings[prefixPart];
  }

  /**
    @function getPrefix
    Create a prefix for a message based on which prefix data is enabled for logging
    Configuration:
    - LOG_TIMESTAMP {'true'|'false'} - include timestamp ISO string into a message prefix
    - LOG_ENVIRONMENT {'true'|'false'} - include current environment into a message prefix
    - LOG_LEVEL {'true'|'false'} - include log level in UPPERCASE into a message prefix
    - LOG_REQID {'true'|'false'} - incldue a reqId into a message prefix
    - LOG_CALLER_PREFIX {'true'|'false'} - incldue a caller prefix of type module:project:function

    reqId will be included only if provided in the message meta

    @param settings {Object} - stream settings. Falls back to {} if not given
    @param delimiter {string} - a character to split prefix parts. Falls back to ':'
    @return {object} - Prefix for the log message. Or an empty string of no prefix data logging is enabled
  **/
  getPrefix(settings = {}, delimiter = ':') {
    const message = this.payload;
    const shouldInclude = this.shouldInclude.bind(this, settings);
    const environment = process.env.NODE_ENV && process.env.NODE_ENV !== 'undefined' ? process.env.NODE_ENV : 'local';
    const prefix = {
      timestamp: shouldInclude('LOG_TIMESTAMP') ? `${new Date().toISOString()}${delimiter}` : '',
      environment: shouldInclude('LOG_ENVIRONMENT') ? `${environment}${delimiter}` : '',
      logLevel: shouldInclude('LOG_LEVEL') ? `${message.level.toUpperCase()}${delimiter}` : '',
      reqId: ''
    };
    if (shouldInclude('LOG_CALLER_PREFIX')) {
      Object.assign(prefix, {
        module: this.callerModuleInfo.module ? `${this.callerModuleInfo.module}${delimiter}` : '',
        function: this.callerModuleInfo.function ? `${this.callerModuleInfo.function}` : '',
        project: this.callerModuleInfo.project ? `${this.callerModuleInfo.project}${delimiter}` : ''
      });
    }
    if (message.meta.reqId) {
      prefix.reqId = shouldInclude('LOG_REQID') ? `${message.meta.reqId}` : '';
    }
    let isEmpty = true;
    for (const key in prefix) { // eslint-disable-line
      if (prefix[key] !== '') {
        isEmpty = false;
        break;
      }
    }
    prefix.isEmpty = isEmpty;
    return prefix;
  }
}

module.exports = Message;
