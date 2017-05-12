const winston = require('winston');

/**
  @class ConsoleLink
  A console logger chain link
  This chain link is responsible for logging a message to the console

  Has the following configurations (either env var or settings param):
  - CONSOLE_LOGGING {'true'|'false'} - switches on / off the use of this chain link
  - MIN_LOG_LEVEL_CONSOLE = {'silly'|'verbose'|'debug'|'info'|'warn'|'error'} - min log level of a message to log
  This config has a higher priority than a global DEFAULT_LOG_LEVEl config
  @see ChainLink @class for info on the log level priorities
  If a message's level is >= than a MIN_LOG_LEVEL_CONSOLE - it will be notified. Otherwise - skipped

  Environment variables have a higher priority over a settings object parameters
**/
class ConsoleLink {
  /**
    @constructor
    Construct an instance of a ConsoleLink @class
    @param configs {Object} - LoggerChain configuration object
    @param utility {Object} - Utility class with some common rules for each chainLink
  **/
  constructor(configs, utility) {
    this.settings = configs || {};
    this.winston = new winston.Logger();
    this.winston.add(winston.transports.Console);
    this.utility = utility;
    this.winston.level = 'silly';
    this.name = 'CONSOLE';
  }

  /**
    @function next
    @param message {Object} - a message package object
    Envoke the handle @function of the next chain link if provided
  **/
  next(message) {
    if (this.nextLink) {
      this.nextLink.handle(message);
    }
  }

  /**
    @function link
    Links current chain link to a next chain link
    @param nextLink {Object} - an optional next link for current chain link
  **/
  link(nextLink) {
    this.nextLink = nextLink;
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
    return ['true', 'false'].includes(process.env.CONSOLE_LOGGING) ?
      process.env.CONSOLE_LOGGING === 'true' : !!this.settings.CONSOLE_LOGGING;
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
      const logLevels = this.utility.logLevels;
      const messageLevel = logLevels.has(content.level) ? content.level : logLevels.get('default');
      const minLogLevel = this.utility.getMinLogLevel(this.settings, this.name);
      if (logLevels.get(messageLevel) >= logLevels.get(minLogLevel)) {
        const prefix = message.getPrefix(this.settings);
        this.winston.log(messageLevel, `${prefix}${content.text}`, content.meta);
      }
    }
    this.next(message);
  }
}

module.exports = ConsoleLink;
