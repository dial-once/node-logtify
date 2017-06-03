# Logtify

[![CircleCI](https://circleci.com/gh/dial-once/node-logtify/tree/develop.svg?style=svg)](https://circleci.com/gh/dial-once/node-logtify/tree/develop)

**[ES6]** Logger based on ``Chain of Responsibility`` pattern and ``winston`` module

### [Dev Tips](https://github.com/dial-once/node-logtify/wiki)

## Installing the module
```bash
npm i logtify
```

This module is an implementation of a chain, where each element is a small submodule, that does it's own small work with the same identical incoming data. ``Console`` chain element is available by default.

Each chain element contains a ``nextChainLink`` property, which is a link to the next element of the chain. It also has a ``handle`` function, which accepts ``Message`` - a **frozen** message object and a ``link`` function, that is meant to set the ``nextChainLink``. A ``handle`` function processes the message and eventually passes is further along the chain to the next element (if exists).

If needed, new chain links and adapters can be added to the chain.

## Configuration
### Minimal
```js
const { logger } = require('logtify')();
```
### Parameters
You can configure the chain by passing the following parameters or setting up the environment variables.

__Such settings will be passed to each chain element__:
```js
const { logger } = require('logtify')({
    CONSOLE_LOGGING: false, // switches off the console link chain
    MIN_LOG_LEVEL: 'info' // minimal message level to be logged
});
```
**NOTE!** Environment variables have a higher priority over the settings object

### Add new chain element
By default, logtify contains only 1 chain link - `Console` chain link. However, you can add new chain links as the following:
```js
require('logtify-logentries')();
require('logtify-bugsnag')();
const { logger } = require('logtify')();
```

### Preconfigure chain element
If you need to preconfigure the chain link before adding it to the chain, you can do it like this:
```js
// these settings are chain-link-specific and will only be received by this chain link
require('logtify-logentries')({ LOGS_TOKEN: 'YOUR_LOGENTRIES_TOKEN' });
require('logtify-bugsnag')({ BUGS_TOKEN: 'YOUR_BUGSNAG_TOKEN' });
const { logger } = require('logtify')();
```

### Add adapter
If a chain link provides an adapter, it will be exposed in the logtify instance
```js
require('logtify-bugsnag');
const { logger, notifier } = require('logtify')();
```

__However, be aware!__ If you import he chain link with adapter __after__ you initialize the chain link, you need to update the reference.

```js
const { logger, notifier } = require('logtify')();
// notifier is undefined
require('logtify-bugsnag');
const { logger, notifier } = require('logtify')();
// notifier is Object 
```



### Logger (Winston adapter) usage:
```js
const { logger } = require('logtify')();

logger.silly('Hello world');
logger.verbose('Hello world');
logger.debug('Hello world');
logger.info('Hello world');
logger.warn('Hello world', { your: 'metadata' }, { at: 'the end' });
logger.error(new Error('Hello world'));
logger.log('info', 'Hello world');

logger.profile('label');

logger.chain // access to chain
```

### Chain Usage:
```js
const { chain } = require('logtify')();

// Functions
chain.log('warn', 'Hello world', { metadata: 'Something' });
chain.link()                   // re-connect the chain
chain.bindAdapter('name', obj) // add adapter
chain.unbindAdapter('name')    // remove adapter
chain.push(obj)                // add chain link

// properties
chain.chainStart;   // { Object }
chain.chainEnd;     // { Object }
chain.settings;     // { Object }
chain.chainLinks;   // { Array }
chain.isConnected;  // { boolean }
chain.adapters;     // { Map }

// classes
chain.Message;      // { Object }
chain.ChainLink;      // { Object }
```

### Interface

### Internal implementation details
Firstly, you call any logging function from either ``logger`` or ``chain``.

Then provided data is then converted into a [frozen](https://www.npmjs.com/package/deep-freeze) message package object:

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
  },
  error: {Error} // in case message type is Error
}
```

Such message structure travels from start to the end of the chain.

Each chain link receives identical copy of a message and does not modify it in any way.

## Tweaking
As mentioned, a module can be configured with either a settings object or env variables.

A chain link will process a message if all the 3 steps are done:
* A chain link is configured and ready
* A chain link will be used
* A message is present

Let's take a look at each chain separately:

Default:
* A Console chain is always ready
* A Console chain will be used if ``CONSOLE_LOGGING !== 'false'`` either as an env var or a property in the settings object
* A message will be sent if ``message.level`` >= ``MIN_LOG_LEVEL_CONSOLE || MIN_LOG_LEVEL`` (env or settings prop)

To change the default logic, change the values of the mentioned properties.

### Default logLevel priority:
- silly -> 0
- verbose -> 1
- debug -> 2
- info -> 3
- warn -> 4
- error -> 5

These values can be found withint a ``ChainLink`` class, exposed by the chain:
```js
const { chain } = require('logtify')();
const { ChainLink } = chain;
```

## Adding your own chain link
The minimal requirements for a chain link is to have the following:
* handle(message) function, that passes the message further after it's logic
* a constructor should consume ``settings`` object, which will be injected when during a link initialization
* next() function, that moves ``message``, received in the ``handle`` function to the next chain link
* link(next) function, setting the ``nextChainLink``

__The last two are implemented by ``ChainLink`` class__

* To be able to preconfigure the chain link before automatic initialization within the chain, it should expose a wrapper function as the following:
```js
module.exports = (settings) => {
  // some logic with the configuration
}
```

To let ``logtify`` automatically tie the chain link to the main chain, it should use one of the chainBuffer's functions:
- addChainLink(chainLink)
or 
- addAdapter(adapter)

This is how you get the chainBuffer object from the logtify module.
__Make sure to not provide any configurations to the chain and let user do it at the right moment.__
```js
const logtify = require('logtify');
const chainBuffer = logtify.chainBuffer;
const { chain } = logtify();
```
* in the settings function, it should construct the following object and add it to the chain buffer
```js
const chainLinkData = {
  class: MyChainLinkClass,
  config: configs
};

chainBuffer.addChainLink(chainLinkData);
// take the global settings
const mergedConfigs = Object.assign({}, configs, chain.settings);
chain.push(new Logstash(mergedConfigs));
```

Thanks to the ``chainBuffer``, if the chain link will be ``required`` before the ``logtify`` module is initialized:
```js
require('logtify-my-custom-chain-link')();
const logtify = require('logtify')();
```
It will be added automatically
And thanks to the ``push`` to the chain itself, in case the chainLink is added ``before`` the initialization of ``logtify``:
```js
const logtify = require('logtify')();
require('logtify-my-custom-chain-link')();
```
It will not loose the settings, that are already there in the ``logtify`` chain

## Prefixing
Chain links may include prefixes into a message. For example
```js
logger.info('Hello world');
```
will result in:

``info: [2017-05-10T15:16:31.468Z:local:INFO:] Hello world instanceId={youtInstanceId}``

A prefix is generated by the Message class, which a chain link receives in a ``handle`` function:
```js
handle(message) {
  // a delimiter can be changed
  const prefix = message.getPrefix(this.settings, '*');
}
```

You can enable/disable them with the following environment variables / parameters for the chain settings:
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

## Presets
To make it easier to config the logger, some presets are available:
* ``dial-once`` - enables Console chain link when ``NODE_ENV`` is either ``staging`` or ``production`` and disables it otherwise

```js
const { chain, logger } = require('logtify')({ presets: ['dial-once'] });
```
* ``no-prefix`` - disables the prefix from the message
* ``prefix`` - enables the prefix in the message

Apply a preset by passing it to the chain configs:
```js
const { chain, logger } = require('logtify')({
    presets: ['dial-once', 'no-prefix']
});
```

## Current included modules
- Winston (logs)
- [deep-freeze](https://www.npmjs.com/package/deep-freeze)
  
## Existing chain links:
- Console chain link (part of this project)
- [Logentries Chain Link](https://github.com/dial-once/node-logtify-logentries)
- [Logstash Chain Link](https://github.com/dial-once/node-logtify-logstash)
- [Bugsnag Chain Link](https://github.com/dial-once/node-logtify-bugsnag)
