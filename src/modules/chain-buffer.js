const assert = require('assert');

/*
 *  @class ChainBuffer
 *  Buffer for the chain.
 *  Bufferizes chain links and adapters for further auto connection to the main link
 *  When initialising, chain looks into a buffer and pulls all the chain links and adapters from here
 */
class ChainBuffer {
  /*
    @constructor
    Construct ChainBuffer instance with the following properties:
    adapters { object } - map of name -> adapter { function }
    chainLinks { array } - array of chain link classes
   */
  constructor() {
    this.adapters = {};
    this.chainLinks = [];
  }
  /**
   * @function addChainLink - adds chain link to the buffer
   * @param CustomChainLink {function|object} - object or a function with the constructor of a chain link
   * If function - should be a constructor
   * If object - should contain config object and constructor class
   */
  addChainLink(CustomChainLink) {
    // if constructor passed in the array
    if (typeof CustomChainLink === 'function') {
      this.chainLinks.push(CustomChainLink);
      // if a pre-configured chainLink with some link-specific settings
    } else if (CustomChainLink !== null && typeof CustomChainLink === 'object') {
      this.chainLinks.push(CustomChainLink);
      // if a pre-configured object also exposes adapter
      if (CustomChainLink.adapter !== null && typeof CustomChainLink.adapter === 'object') {
        this.addAdapter(CustomChainLink.adapter);
      }
    }
  }

  /**
   * @function addAdapter - adds chain link adapter to the buffer
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

module.exports = ChainBuffer;
