# node-microservice-boot

[![Circle CI](https://circleci.com/gh/dial-once/node-microservice-boot/tree/develop.svg?style=shield)](https://circleci.com/gh/dial-once/node-microservice-boot)
[![Coverage](http://badges.dialonce.io/?resource=node-microservice-boot&metrics=coverage)](http://sonar.dialonce.io/overview/coverage?id=node-microservice-boot)
[![Sqale](http://badges.dialonce.io/?resource=node-microservice-boot&metrics=sqale_rating)](http://sonar.dialonce.io/overview/debt?id=node-microservice-boot)

Message log chain for @dial-once node microservices  
requires es6

A module is based on the ``Chain of Responsibility`` pattern along with ``Adapter`` pattern for backward compatibility.
A module exposes a chain with some default chain links (console, logentries, bugsnag).
Each chain is an atomic separate plugin to process a message in it's own way, which is:
- console -> print out to std.out with winston
- logentries -> print out to logentries endpoint
- bugsnag -> notify to bugsnag

## Installing the module
```bash
npm i @dialonce/boot
```

## Using it
Require it as the first instruction (after env vars are set)
```js
require('@dialonce/boot')({
    LOGS_TOKEN: '', // logentries token
    BUGS_TOKEN: '', // bugsnag token
    MIN_LOG_LEVEL: '',  // minimal log level to process a message
    DEFAULT_LOG_LEVEL: '', // default log level for message if not given
    MIN_LOG_LEVEL_CONSOLE: '', // minimal log level to process a message by console logger chain link
    MIN_LOG_LEVEL_LOGENTRIES: '', // minimal log level to process a message by logentries logger chain link
    CONSOLE_LOGGING: true || false, // switch on / off console logger chain link
    LOGENTRIES_LOGGING: true || false, // switch on / off logentries logger chain link
    BUGSNAG_LOGGING: true || false // switch on / off bugsnag logger chain link
});
```



## Using logger/reporter
You can use the logger/reporter directly from the module, without including the deps in your project. This will allow us to update/switch providers easily.

```js
const { chain, logger, notifier } = require('@dialonce/boot')();
```

*Please note that these instructions will print an error if the module has not been initialised before*

A ``chain`` object is an instance of a ``LoggerChain`` class, which implements a Chain of Responsibility pattern, while ``logger`` and ``notifier`` are adapters to make the resulting interface more user friendly.

**NOTE!** If you use ``chain.log()`` function, your message will travel along the chain and each chain link will process it.
``logger`` is a class, used to provide the same interface as ``winston`` package does. Although, it still sends a message to the ``chain.log`` function internally.

However, a ``notifier`` is a single node, which will process the message outside the chain.

This decision was made out of the idea that ``notifier`` might be used in some situations when you just want an error to be sent to bugsnag omitting all the other chains.

In a general case, you might want to use a ``logger`` or a ``chain`` objects.

### Interface

**Logger** exposes the following set of data:
```js
// logging functions
logger.silly(message, ...metadata);
logger.verbose(message, ...metadata);
logger.debug(message, ...metadata);
logger.info(message, ...metadata);
logger.warn(message, ...metadata);
logger.error(message, ...metadata);
logger.log(logLevel, message, ...metadata);

// profiling function
logger.profile(label);

// properties
logger.loggerChain; // instance of a logger chain
```

**Notifier** exposes:
```js
// function
notifier.notify(message, ...metadata);

// property
notifier.settings // configuration object
notifier.requestHandler // standard bugsnag requestHandler middleware
```

**Chain** exposes:
```js
// functions
chain.log(logLevel, message, ...metadata);

//properties
chain.settings; // configuration object
chain.bugsnagChain; // Bugsnag chain link
chain.logentriesChain; // Logentries chain link
chain.consoleChain; // Console chain link
chain.chainStart; // first chain link (console by default)
chain.chainEnd; // last chain link (bugsnag by default)
chain.ChainLink; // ChainLink class - used to create a custom chainLink
```

### Internal implementation details
Firstly, you call any of the either ``logger`` or ``notifier`` or ``chain`` function.

Then provided data is then converted into a ``frozen`` (``Object.freeze()``) message package object:

```js
// if text message
{
  level: {'silly'|'verbose'|'debug'|'info'|'warn'|'error'},
  text: {string},
  meta: {
    instanceId: {string},
    notify: {true}, // by default,
    stack: {string}, // in case error was given to log,
    ... (other metadata provided in runtime)
  }
}
```

Such message structure travels from start to the end of the chain.

Each chain link receives identical copy of a message and does not modify it in any way.

By default, if message level is ``warn`` or ``error``, it will be processed by bugsnag chain (if turned on) and notify to bugsnag. In order to block it for a certain messae, include ``{ notify: false }`` as a metadata:
```js
// either via bugsnag adapter
notifier.notify('Hello world', { notify: false });
// or via winston adapter
logger.warn('Hello world', { notify: false });
// or directly via a chain
chain.log('warn', 'Hello world', { notify: false });
```
## Tweaking
As mentioned, a module can be configured with either a settings object or env variables.

A chain link will process a message if all the 3 steps are done:
* A chain is configured and ready
* A chain will be used
* A message is present

Let's take a look at each chain separately:

### Console
Default:
* A chain is always ready
* A chain will be used if ``CONSOLE_LOGGING='true'`` either as an env var or a property in the settings object
* A message will be sent if ``message.level`` >= ``MIN_LOG_LEVEL_CONSOLE || MIN_LOG_LEVEL`` (env or settings prop)

### Logentries
Default:
* A chain ready if ``LOGS_TOKEN`` is present in settings
* A chain will be used if ``LOGENTRIES_LOGGING='true'`` either as an env var or a property in the settings object
* A message will be sent if ``message.level`` >= ``MIN_LOG_LEVEL_LOGENTRIES || MIN_LOG_LEVEL`` (env or settings prop)

### Bugsnag
Default:
* A chain is ready if ``BUGS_TOKEN`` is present in settings
* A chain will be used if ``BUGSNAG_LOGGING='true'``either as an env var or a property in the settings object
* A message will be sent if ``message.level`` >= ``error`` and ``message.meta.notify=true``

To change the default logic, change the values of the mentioned properties.

### Default logLevel priority:
- silly -> 0
- verbose -> 1
- debug -> 2
- info -> 3
- warn -> 4
- error -> 5

## Adding your own chain link
Each chain link extends a ``ChainLink`` class, which contains the following data:
```js
// functions
getMinLogLevel(chain) // returns {string} - global MIN_LOG_LEVEL or chain-specific (if chain={string})
next(message) // pass a message to the next chain link
link(chainLink) // set chainLink as a next chain link for the current one
isReady() // returns {boolean} - if a chainLink is switched on / off (described above)
isEnabled() // returns {boolean} - whether a chainLink is going to be used (described above)
handle(message) // process a message and move to the next chain link

// properties
nextLink // {object} - next chain link
settings // {object} - settings with configs for the chain
logLevels // {object instanceof Map} - {level, priority} key-value pair
```

To add a new link to the end of the chain, do the following:
```js
const { chain } = require('@dialonce/boot')();
class MyChainLink extends chain.ChainLink {
    constructor(settings, nextChainLink){
        super(nextChainLink, settings);
    }
    
    handle(message) {
        console.log(message);
    }
}

const customChainLink = new MyChainLink(chain.settings, null);
chain.chainEnd.link(customChainLink);
chain.chainEnd = chain.chainEnd.nextLink;
```

## Prefixing
By default, messages will contain a prefix:
```js
logger.info('Hello world');
```
will result in:

``info: [2017-05-10T15:16:31.468Z:local:INFO:] Hello world instanceId={youtInstanceId}``

You can enable/disable them with the following environment variables:
```
process.env.LOG_TIMESTAMP = 'true';
process.env.LOG_ENVIRONMENT = 'true';
process.env.LOG_LEVEL = 'true';
process.env.LOG_REQID = 'true';
```

**Note!** that if the ``LOG_REQID`` is set to ``'true'``, it will still not log it (as seen from example above), unless it is provided in the ``message.meta``.
So, to include it, you should do the following:
```js
logger.info('Hello world', { reqId: 'goingCrazy' });
```
And it will result in:

``info: [2017-05-10T15:16:31.468Z:local:INFO:goingCrazy] Hello world instanceId={youtInstanceId}``

## Current included modules
  - Bugsnag (bug reports)
  - Logentries (logs)
  - Winston (logs)
