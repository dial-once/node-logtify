const winston = require('winston');
const Subscriber = require('../modules/subscriber');

/**
 * @class ConsoleLink
 * A console logger subscriber
 * This subscriber is responsible for logging a message to the console
 *
 * Has the following configurations (either env var or settings param):
 * - CONSOLE_LOGGING {'true'|'false'} - switches on / off the use of this subscriber
 * - MIN_LOG_LEVEL_CONSOLE = {'silly'|'verbose'|'debug'|'info'|'warn'|'error'} - min log level of a message to log
 * @see Subscriber @class for info on the log level priorities
 * If a message's level is >= than a MIN_LOG_LEVEL_CONSOLE - it will be notified. Otherwise - skipped
 *
 * Environment variables have a higher priority over a settings object parameters
 */
class ConsoleLink extends Subscriber {
  /**
   * @constructor
   * Construct an instance of a ConsoleLink @class
   * @param configs {Object} - LoggerStream configuration object
   * @param utility {Object} - Utility class with some common rules for each subscriber
   */
  constructor(settings) {
    super();
    this.settings = settings || {};
    this.winston = new winston.Logger();
    this.winston.add(winston.transports.Console);
    this.name = 'CONSOLE';
  }

  /**
   * @function isReady
   * Check if a subscriber is configured properly and is ready to be used
   * @return {boolean}
   */
  isReady() {
    return !!this.winston;
  }

  /**
   * @function isEnabled
   * Check if a subscriber will be used
   * Depends on configuration env variables / settings object parameters
   * Checks CONSOLE_LOGGING env / settings object param
   * @return {boolean} - if this subscriber is switched on / off
   */
  isEnabled() {
    const result = ['true', 'false'].includes(process.env.CONSOLE_LOGGING)
      ? process.env.CONSOLE_LOGGING === 'true' : this.settings.CONSOLE_LOGGING;
    // enabled by default
    return [null, undefined].includes(result) ? true : result;
  }

  /**
   * @function handle
   * Process a message and log it if the subscriber is switched on and message's log level is >= than MIN_LOG_LEVEL
   * Finally, pass the message to the next subscriber if any
   * @param message {Object} - message package object
   * @see LoggerStream message package object structure description
   */
  handle(message) {
    // profiling is blocked, because winstron.profile already printst he message to console
    if (this.isReady() && this.isEnabled() && message && !message.payload.profiling) {
      const content = message.payload;
      const messageLevel = this.logLevels.has(content.level) ? content.level : this.logLevels.get('default');
      const minLogLevel = this.getMinLogLevel(this.settings, this.name);
      if (this.logLevels.get(messageLevel) >= this.logLevels.get(minLogLevel)) {
        const prefix = message.getPrefix(this.settings);
        let prefixText = !prefix.isEmpty
          ? `[${prefix.timestamp}${prefix.environment}${prefix.logLevel}${prefix.reqId}] ` : '';
        // if prefix contains these props, then caller module prefix was configured by settings/env
        if ({}.hasOwnProperty.call(prefix, 'module')
            && {}.hasOwnProperty.call(prefix, 'function')
            && {}.hasOwnProperty.call(prefix, 'project')) {
          prefixText += `[${prefix.project}${prefix.module}${prefix.function}] `;
        }
        const messageText = `${prefixText}${content.text}`;
        const jsonify = process.env.JSONIFY ? process.env.JSONIFY === 'true' : !!this.settings.JSONIFY;
        const metadata = jsonify ? message.jsonifyMetadata() : content.meta;
        this.winston.log(messageLevel, messageText, metadata);
      }
    }
  }
}

module.exports = ConsoleLink;
