# Logtify

[![CircleCI](https://circleci.com/gh/dial-once/node-logtify/tree/develop.svg?style=svg)](https://circleci.com/gh/dial-once/node-logtify/tree/develop)

### [Dev Tips](https://github.com/dial-once/node-logtify/wiki)

## Installing the module
```bash
npm i -S logtify
```

## Configuration
Full list of env variables. Can be used in config object with the same name. Each of them is optional
```
LOG_TIMESTAMP = 'true'
LOG_ENVIRONMENT = 'true'
LOG_LEVEL = 'true'
LOG_REQID = 'true' // only included when provided with metadata
LOG_CALLER_PREFIX = 'true' // additional prefix with info about caller module/project/function
JSONIFY = 'true' // converts metadata to json
CONSOLE_LOGGING = 'true'
LOGENTRIES_LOGGING = 'true'
LOGSTASH_LOGGING = 'true'
BUGSNAG_LOGGING = 'true'
```

Environment variables have a higher priority over the settings object

### Minimal
```js
const { logger } = require('logtify')();
```
### Configuration via object

```js
// Note, that such settings will be passed to each subscriber:
const { logger } = require('logtify')({
    CONSOLE_LOGGING: false, // switches off the console subscriber
    MIN_LOG_LEVEL: 'info' // minimal message level to be logged
});
```

### Add new subscriber
A subscriber is a small independent logger unit, whose job is to send logs to (ideally) one service/node.

By default, logtify contains only 1 subscriber - `Console`.

However, you can add [any of the following available subscribers](https://github.com/dial-once/node-logtify/tree/feature/metadata-handling#existing-subscribers)

### Add adapter
An adapter is a small plugin, meant to ease the usage of some subscriber.

If a subscriber provides an adapter, it will be exposed in the logtify instance
```js
require('logtify-bugsnag')();
const { logger, notifier } = require('logtify')();
```

If you import he subscriber with adapter __after__ you initialize the stream, you need to update the logtify reference, because __adapter property will be undefined__.

### Logger usage:
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
```

### Stream Usage:
```js
const { stream } = require('logtify')();

stream.log('warn', 'Hello world', { metadata: 'Something' });

// properties
stream.settings;         // Object
stream.adapters;         // Map
stream.subscribersCount; // Number

// classes
stream.Message;          // Object
stream.Subscriber;       // Object
```

### Message format

Then provided data is converted into a message package object of the following structure:

```js
// if text message
{
  level: {'silly'|'verbose'|'debug'|'info'|'warn'|'error'},
  text: {string},
  meta: {
    instanceId: {string},
    ... (other metadata provided in runtime)
  }
}
```

Metadata object can be stringified to JSON with ``process.env.JSONIFY = 'true'``. Alternatively, you can do the same via configs object.

### Default logLevel priority:
- silly -> 0
- verbose -> 1
- debug -> 2
- info -> 3
- warn -> 4
- error -> 5

## Adding your own subscriber

Please refer to [Dev Tips](https://github.com/dial-once/node-logtify/wiki) for more information on the topic

## Prefixing
Subscribers may include prefixes into a message. For example
```js
logger.info('Hello world');
```
will result in:

``info: [2017-05-10T15:16:31.468Z:local:INFO:] Hello world instanceId={youtInstanceId}``

You can enable/disable them with the following environment variables / parameters for the stream settings:
```
process.env.LOG_TIMESTAMP = 'true';
process.env.LOG_ENVIRONMENT = 'true';
process.env.LOG_LEVEL = 'true';
process.env.LOG_REQID = 'true';
process.env.LOG_CALLER_PREFIX = 'true';
```

`LOG_CALLER_PREFIX` - enables/disables printing of additional prefix: `[project:module:function]` with information about the caller project

**Note!** that if the ``LOG_REQID`` is set to ``'true'``, it will still not log it (as seen from example above), unless it is provided in the ``message.meta``.
So, to include it, you should do the following:
```js
logger.info('Hello world', { reqId: 'something' });
```
And it will result in:

``info: [2017-05-10T15:16:31.468Z:local:INFO:something] Hello world instanceId={yourInstanceId}``

## Presets
To make it easier to config the logger, some presets are available:
* ``dial-once`` - enables Console subscriber when ``NODE_ENV`` is neither ``staging`` or ``production`` and disables it otherwise. Also includes ``jsonify`` option.

```js
const { stream, logger } = require('logtify')({ presets: ['dial-once'] });
```
* ``no-prefix`` - disables the prefix from the message
* ``prefix`` - enables the prefix in the message
* ``jsonify`` - convert message metadata to JSON. By defaunt, object is flattened

Apply a preset by passing it to the stream configs:
```js
const { stream, logger } = require('logtify')({
    presets: ['dial-once', 'no-prefix']
});
```
  
## Existing subscribers:
- Console subscriber (part of this project)
- [Logentries Subscriber](https://github.com/dial-once/node-logtify-logentries)
- [Logstash Subscriber](https://github.com/dial-once/node-logtify-logstash)
- [Bugsnag Subscriber](https://github.com/dial-once/node-logtify-bugsnag)
