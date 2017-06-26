const assert = require('assert');

/*
 *  @class StreamBuffer
 *  Buffer for the stream.
 *  Bufferizes subscribers and adapters for further auto connection to the main link
 *  When initialising, stream looks into a buffer and pulls all the subscribers and adapters from here
 */
class StreamBuffer {
  /*
    @constructor
    Construct StreamBuffer instance with the following properties:
    adapters { object } - map of name -> adapter { function }
    subscribers { array } - array of subscriber classes
   */
  constructor() {
    this.adapters = {};
    this.subscribers = [];
  }
  /**
   * @function addSubscriber - adds subscriber to the buffer
   * @param CustomSubscriber {function|object} - object or a function with the constructor of a subscriber
   * If function - should be a constructor
   * If object - should contain config object and constructor class
   */
  addSubscriber(CustomSubscriber) {
    // if constructor passed in the array
    if (typeof CustomSubscriber === 'function') {
      this.subscribers.push(CustomSubscriber);
      // if a pre-configured subscriber with some link-specific settings
    } else if (CustomSubscriber !== null && typeof CustomSubscriber === 'object') {
      this.subscribers.push(CustomSubscriber);
      // if a pre-configured object also exposes adapter
      if (CustomSubscriber.adapter !== null && typeof CustomSubscriber.adapter === 'object') {
        this.addAdapter(CustomSubscriber.adapter);
      }
    }
  }

  /**
   * @function addAdapter - adds subscriber adapter to the buffer
   * @param adapter {object} - adapter object
   */
  addAdapter(adapter) {
    // Custom adapters
    // adapter key-value objects: { name -> constructor  }
    if (adapter !== null && typeof adapter === 'object') {
      if (adapter.name && adapter.class) {
        assert(typeof adapter.name === 'string');
        assert(typeof adapter.class === 'function');
        Object.assign(this.adapters, {
          [adapter.name]: adapter.class
        });
      } else {
        Object.assign(this.adapters, adapter);
      }
    }
  }
}

module.exports = StreamBuffer;
