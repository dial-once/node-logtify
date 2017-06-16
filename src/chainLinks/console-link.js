const winston = require('winston');
const ChainLink = require('../modules/chain-link');
/**
  @class ConsoleLink
  A console logger chain link
  This chain link is responsible for logging a message to the console

  Has the following configurations (either env var or settings param):
  - CONSOLE_LOGGING {'true'|'false'} - switches on / off the use of this chain link
  - MIN_LOG_LEVEL_CONSOLE = {'silly'|'verbose'|'debug'|'info'|'warn'|'error'} - min log level of a message to log
  @see ChainLink @class for info on the log level priorities
  If a message's level is >= than a MIN_LOG_LEVEL_CONSOLE - it will be notified. Otherwise - skipped

  Environment variables have a higher priority over a settings object parameters
**/
class ConsoleLink extends ChainLink {
  /**
    @constructor
    Construct an instance of a ConsoleLink @class
    @param configs {Object} - LoggerChain configuration object
    @param utility {Object} - Utility class with some common rules for each chainLink
  **/
  constructor(configs) {
    super();
    this.settings = configs || {};
    this.winston = new winston.Logger();
    this.winston.add(winston.transports.Console);
    this.name = 'CONSOLE';
  }

  /**
    @function isReady
    Check if a chain link is configured properly and is ready to be used
    @return {boolean}
  **/
  isReady() {
    return !!this.winston;
  }

  /**
    @function isEnabled
    Check if a chain link will be used
    Depends on configuration env variables / settings object parameters
    Checks CONSOLE_LOGGING env / settings object param
    @return {boolean} - if this chain link is switched on / off
  **/
  isEnabled() {
    const result = ['true', 'false'].includes(process.env.CONSOLE_LOGGING) ?
      process.env.CONSOLE_LOGGING === 'true' : this.settings.CONSOLE_LOGGING;
    // enabled by default
    return [null, undefined].includes(result) ? true : result;
  }

  /**
    @function handle
    Process a message and log it if the chain link is switched on and message's log level is >= than MIN_LOG_LEVEL
    Finally, pass the message to the next chain link if any
    @param message {Object} - message package object
    @see LoggerChain message package object structure description

    This function is NOT ALLOWED to modify the message
    This function HAS to invoke the next() @function and pass the message further along the chain
    This function HAS to check message level priority and skip if lower than MIN_LOG_LEVEL
  **/
  handle(message) {
    if (this.isReady() && this.isEnabled() && message) {
      const content = message.payload;
      const messageLevel = this.logLevels.has(content.level) ? content.level : this.logLevels.get('default');
      const minLogLevel = this.getMinLogLevel(this.settings, this.name);
      if (this.logLevels.get(messageLevel) >= this.logLevels.get(minLogLevel)) {
        const prefix = message.getPrefix(this.settings);
        const messageText = !prefix.isEmpty ?
          `[${prefix.timestamp}${prefix.environment}${prefix.logLevel}${prefix.reqId}]${content.text}` :
          content.text;
        this.winston.log(messageLevel, messageText, content.meta);
      }
    }
    this.next(message);
  }
}

module.exports = ConsoleLink;
