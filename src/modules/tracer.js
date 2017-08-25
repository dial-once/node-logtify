const path = require('path');

/**
 * Traces the caller of the logtify module
 */
class Tracer {
  /**
   * Try to get the information about caller module
   * function, that called the module, the name of the file this function is from and the name of the project
   * This data will be used in prefixes
   * @return {object} - {
   *   function: {string}, - name of the callee function. 'anonymous' if none or arrow function
   *   module: {string}, - name of the parent module
   *   project: {string} - name of the parent module. Empty if none
   * }
   */
  trace() {
    try {
      const callerFileInfo = this.getCallerFileInfo();
      const callerFunction = callerFileInfo.getFunctionName();
      const callerModule = callerFileInfo.getFileName().split(path.sep).pop();
      // if logtify was required using absolute local path or during tests, there is no parent project
      // So we check if the __dirname has node_modules inside to make sure it was called as a dependency
      // So if we have __dirname as /var/lib/MyAwesomeProject/node_modules/node-logtify/...
      // We eventually get MyAwesomeProject
      const callerProject = __dirname.includes('node_modules') ?
        __dirname.split(`${path.sep}node_modules${path.sep}`)[0].split(path.sep).pop() : '';
      return {
        function: callerFunction || 'anonymous',
        module: callerModule,
        project: callerProject
      };
    } catch (e) {
      return {};
    }
  }


  /**
   * Get the path to the file from parent project where a logging function was invoked
   * @return {CallSite} - stack entry with the information about callee file
   */
  getCallerFileInfo() {
    const prepareStack = Error.prepareStackTrace;
    Error.prepareStackTrace = (_, stack) => stack;
    // skipping entry under index 0 because it is this (getCallerFileInfo) function that initialized an Error
    const stack = new Error().stack.slice(1);
    Error.prepareStackTrace = prepareStack;
    let i = 0;
    let stackEntry;
    // We are not interested in calls of logtify from other dependencies and logtify-related projects
    // This way we are sure that we get the path to a file from a parent project, not some dependency
    do {
      stackEntry = stack[i];
      ++i;
    }
    while (stackEntry.getFileName().includes('logtify') || stackEntry.getFileName().includes('node_modules'));
    // path to a file that called either adapeter's function or logtify's native function i.e. logger.info() ish or stream.log()
    return stackEntry;
  }
}

module.exports = new Tracer();
