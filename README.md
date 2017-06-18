# Logtify

[![CircleCI](https://circleci.com/gh/dial-once/node-logtify/tree/develop.svg?style=svg)](https://circleci.com/gh/dial-once/node-logtify/tree/develop)

**[ES6] [Rx]**

### [Dev Tips](https://github.com/dial-once/node-logtify/wiki)

## Installing the module
```bash
npm i logtify
```

This module uses RxJs library to implement a pub-sub model.

Each subscriber contains a ``handle`` function, which accepts ``Message``.

If needed, new subscribers and adapters can be added to the stream.

## Configuration
### Minimal
```js
const { logger } = require('logtify')();
```
### Parameters
You can configure the stream by passing the following parameters or setting up the environment variables.

```js
// Note, that such settings will be passed to each subscriber:
const { logger } = require('logtify')({
    CONSOLE_LOGGING: false, // switches off the console subscriber
    MIN_LOG_LEVEL: 'info' // minimal message level to be logged
});

// env variables only
LOGTIFY_BUFFER_SIZE = 1; // amount of log messages that will be kept in buffer before disposed
```
**NOTE!** Environment variables have a higher priority over the settings object

### Add new subscriber
By default, logtify contains only 1 subscriber - `Console`. However, you can add new subscruber as the following:
```js
require('logtify-logentries')();
require('logtify-bugsnag')();
const { logger } = require('logtify')();
```

### Preconfigure subscriber
If you need to preconfigure the subscriber before adding it to the stream, you can do it like this:
```js
// these settings are subscriber-specific and will only be received by this subscriber
require('logtify-logentries')({ LOGS_TOKEN: 'YOUR_LOGENTRIES_TOKEN' });
require('logtify-bugsnag')({ BUGS_TOKEN: 'YOUR_BUGSNAG_TOKEN' });
const { logger } = require('logtify')();
```

### Add adapter
If a subscriber provides an adapter, it will be exposed in the logtify instance
```js
require('logtify-bugsnag');
const { logger, notifier } = require('logtify')();
```

__However, be aware!__ If you import he subscriber with adapter __after__ you initialize the stream, you need to update the reference.

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

logger.stream // access to stream
```

### Stream Usage:
```js
const { stream } = require('logtify')();

// Functions
stream.log('warn', 'Hello world', { metadata: 'Something' });
stream.bindAdapter('name', obj) // add adapter
stream.unbindAdapter('name')    // remove adapter
stream.subscribe(subscriber)     // add a subscriber

// properties
stream.settings;     // { Object }
stream.adapters;     // { Map }

// classes
stream.Message;      // { Object }
stream.Subscriber;      // { Object }
```

### Interface

### Internal implementation details
Firstly, you call any logging function from either ``logger`` or ``stream``.

Then provided data is then converted into a message package object of the following structure:

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

Each subscriber receives identical copy of a message.

## Tweaking
As mentioned, a module can be configured with either a settings object or env variables.

A subscriber will process a message if all the 3 steps are done:
* A subscriber is configured and ready
* A subscriber will be used
* A message is present

Default:
* A Console subscriber is always ready
* A Console subscriber will be used if ``CONSOLE_LOGGING !== 'false'`` either as an env var or a property in the settings object
* A message will be sent if ``message.level`` >= ``MIN_LOG_LEVEL_CONSOLE || MIN_LOG_LEVEL`` (env or settings prop)

To change the default logic, change the values of the mentioned properties.

### Default logLevel priority:
- silly -> 0
- verbose -> 1
- debug -> 2
- info -> 3
- warn -> 4
- error -> 5

These values can be found withint a ``Subscriber`` class, exposed by the stream:
```js
const { stream } = require('logtify')();
const { Subscriber } = stream;
```

## Adding your own subscriber
The minimal requirements for a subscriber is to have the following:
* handle(message) function, that passes the message further after it's logic
* a constructor should consume ``settings`` object, which will be injected when during a link initialization

* To be able to preconfigure the subscriber before automatic initialization within the stream, it should expose a wrapper function as the following:
```js
module.exports = (settings) => {
  // some logic with the configuration
}
```

To let ``logtify`` automatically tie the subscriber to the main stream, it should use one of the streamBuffer's functions:
- addSubscriber(subscriber)
or 
- addAdapter(adapter)

This is how you get the streamBuffer object from the logtify module.
__Make sure to not provide any configurations to the stream and let user do it at the right moment.__
```js
const logtify = require('logtify');
const streamBuffer = logtify.streamBuffer;
const { stream } = logtify();
```
* in the settings function, it should construct the following object and add it to the stream buffer
```js
const subscriberData = {
  class: MySubscriberClass,
  config: configs
};

streamBuffer.addSubscriber(subscriberData);
// take the global settings
const mergedConfigs = Object.assign({}, configs, stream.settings);
stream.subscribe(new Logstash(mergedConfigs));
```

Thanks to the ``streamBuffer``, if the subscriber will be ``required`` before the ``logtify`` module is initialized:
```js
require('logtify-my-custom-subscriber')();
const logtify = require('logtify')();
```
It will be added automatically

## Prefixing
Subscribers may include prefixes into a message. For example
```js
logger.info('Hello world');
```
will result in:

``info: [2017-05-10T15:16:31.468Z:local:INFO:] Hello world instanceId={youtInstanceId}``

A prefix is generated by the Message class, which a subscriber receives in a ``handle`` function:
```js
handle(message) {
  // a delimiter can be changed
  const prefix = message.getPrefix(this.settings, '*');
}
```

You can enable/disable them with the following environment variables / parameters for the stream settings:
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
* ``dial-once`` - enables Console subscriber when ``NODE_ENV`` is neither ``staging`` or ``production`` and disables it otherwise

```js
const { stream, logger } = require('logtify')({ presets: ['dial-once'] });
```
* ``no-prefix`` - disables the prefix from the message
* ``prefix`` - enables the prefix in the message

Apply a preset by passing it to the stream configs:
```js
const { stream, logger } = require('logtify')({
    presets: ['dial-once', 'no-prefix']
});
```

## Current included modules
- Winston (logs)
- [deep-freeze](https://www.npmjs.com/package/deep-freeze)
  
## Existing subscribers:
- Console subscriber (part of this project)
- [Logentries Subscriber](https://github.com/dial-once/node-logtify-logentries)
- [Logstash Subscriber](https://github.com/dial-once/node-logtify-logstash)
- [Bugsnag Subscriber](https://github.com/dial-once/node-logtify-bugsnag)
