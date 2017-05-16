# Logtify

[![CircleCI](https://circleci.com/gh/dial-once/node-logtify.svg?style=svg)](https://circleci.com/gh/dial-once/node-logtify)

**[ES6]** Logger based on ``Chain of Responsibility`` pattern and ``winston`` module

### [Dev Tips](https://github.com/dial-once/node-logtify/wiki)

## Installing the module
```bash
npm i @dialonce/logtify
```

This module is an implementation of a chain, where each element is a small submodule, that does it's own small work with the same identical incoming data. ``Console`` chain element is available by default.

Each chain element contains a ``nextChainLink`` property, which is a link to the next element of the chain. It also has a ``handle`` function, which accepts ``Message`` - a **frozen** message object and a ``link`` function, that is meant to set the ``nextChainLink``. A ``handle`` function processes the message and eventually passes is further along the chain to the next element (if exists).

If needed, new chain links and adapters can be added to the chain.

## Configuration
### Minimal
```js
const { logger } = require('@dialonce/logtify')();
```
### Parameters
You can configure the chain by passing the following parameters or setting up the environment variables. Such settings will be passed to each chain element sequentially:
```js
const { logger } = require('@dialonce/logtify')({
    CONSOLE_LOGGING: true, // switches on the console link chain
    MIN_LOG_LEVEL: 'info' // minimal message level to be logged
});
```
**NOTE!** Environment variables have a higher priority over the settings object

### Add new chain element
By default, logtify contains only 1 chain link - `Console` chain link. However, you can add new chain links as the following:
```js
const { LogentriesChainLink } = require('@dialonce/logtify-logentries');
const { BugsnagChainLink } = require('@dialonce/logtify-bugsnag');
const { logger } = require('@dialonce/logtify')({
    LOGENTRIES_LOGGING: false, // switch off the Logentries chain element
    BUGSNAG_LOGGING: true // switch on the Bugsnag chain element
    chainLinks: [LogentriesChainLink, BugsnagChainLink]
});
```

### Preconfigure chain element
If you need to preconfigure the chain link before adding it to the chain, you can do it like this:
```js
const { logger } = require('@dialonce/logtify')({
    chainLinks: [
        require('@dialonce/logtify-logentries')({ LOGS_TOKEN: 'YOUR_LOGENTRIES_TOKEN' }),
        require('@dialonce/logtify-bugsnag')({ BUGS_TOKEN: 'YOUR_BUGSNAG_TOKEN' })
    ]
});
```

### Add adapter
``@dialonce/logtify-bugsnag`` provides access to the Bugsnag adapter:
```js
const { BugsnagAdapter } = require('@dialonce/logtify-bugsnag');
const { logger, notifier } = require('@dialonce/logtify')({
    adapters: { notifier: BugsnagAdapter }
});
```
As you can see, adapter property name is the key under which this adapter will be accessed when referencing the module

### Manual config
You can also set up chain links and adapters manually, as the following:
```js
const { BugsnagAdapter, BugsnagChainLink } = require('@dialonce/logtify-bugsnag');
const { chain } = require('@dialonce/logtify')();
chain.push(new BugsnagChainLink(chain.settings));

// Adding an adapter
chain.bindAdapter('notifier', new BugsnagAdapter(chain, chain.settings));
```

### Logger (Winston adapter) usage:
You might be using this module most of the time
```js
const { logger } = require('@dialonce/logtify')();

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
// Functions
const { chain } = require('@dialonce/logtify')();
chain.log('warn', 'Hello world', { metadata: 'Something' });
chain.link() // re-connect the chain
chain.bindAdapter('name', obj) // add adapter
chain.unbindAdapter('name') // remove adapter
chain.push(obj) // add chain link

// properties
chain.chainStart;
chain.chainEnd;
chain.settings;
chain.chainLinks;
chain.isConnected;
chain.adapters;

// classes
chain.Message;
chain.Utility;
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
* A Console chain will be used if ``CONSOLE_LOGGING='true'`` either as an env var or a property in the settings object
* A message will be sent if ``message.level`` >= ``MIN_LOG_LEVEL_CONSOLE || MIN_LOG_LEVEL`` (env or settings prop)

To change the default logic, change the values of the mentioned properties.

### Default logLevel priority:
- silly -> 0
- verbose -> 1
- debug -> 2
- info -> 3
- warn -> 4
- error -> 5

These values can be found withint a ``message`` object, that is passed into a ``handle (message)``  function

## Adding your own chain link
The minimal requirements for a chain link is to have the following:
* handle(message) function, that passes the message further after it's logic
* link(next) function, setting the ``nextChainLink``
* a constructor should consume ``settings`` object, which will be injected when during a link initialization

Because of the different ways of an automatized way of adding a chainLink, a custom one has to support the following behavior:
* To be able to automatically add a chain link without being preconfigured, it should expose a class, a constructor of which should accept a ``settings`` object
* To be able to preconfigure the chain link (if such option is required) before automatic initialization within the chain, it should expose a wrapper function as the following:
```js
module.exports = (settings) => {
    // some logic with the configuration
    return {
        class: MyChainLinkClass, // will be called with new MyChainLinkClass(config) when chain is initialized
        config: settings,
        adapter: { // optional. If given, will auto init adapter when chainLink is initialized
          name: {string},
          class: MyChainLinkAdapterClass
        }
      }
    }
}
```

## Prefixing
By default, messages will contain a prefix:
```js
logger.info('Hello world');
```
will result in:

``info: [2017-05-10T15:16:31.468Z:local:INFO:] Hello world instanceId={youtInstanceId}``

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

**Default prefix is generated by the Message object, passed into the handle(message) function**

## Presets
To make it easier to config the logger, some presets are available:
* ``dial-once`` - enables Console chain link when ``NODE_ENV`` is either ``staging`` or ``production`` and disables it otherwise

Initializes [Logentries Chain Link](https://github.com/dial-once/node-logtify-logentries)

Initializes [Bugsnag Chain Link](https://github.com/dial-once/node-logtify-bugsnag)
```js
const { chain, logger, notifier } = require('logtify')({ presets: ['dial-once'] });
```
* ``no-prefix`` - disables the prefix from the message
* ``prefix`` - enables the prefix in the message

Apply a preset by passing it to the chain configs:
```js
const { chain, logger } = require('@dialonce/logtify')({
    presets: ['dial-once', 'no-prefix']
});
```

## Current included modules
- Winston (logs)
- [deep-freeze](https://www.npmjs.com/package/deep-freeze)
- [Logentries Chain Link](https://github.com/dial-once/node-logtify-logentries)
- [Bugsnag Chain Link](https://github.com/dial-once/node-logtify-bugsnag)
  
## Existing chain links:
- Console chain link (part of this project)
- [Logentries Chain Link](https://github.com/dial-once/node-logtify-logentries)
- [Bugsnag Chain Link](https://github.com/dial-once/node-logtify-bugsnag)
