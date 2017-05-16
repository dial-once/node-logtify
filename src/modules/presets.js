const logentries = require('logtify-logentries');
const bugsnag = require('logtify-bugsnag');

/**
  @function configPrefix
  return an piece of settings object, configured by a 'prefix' or 'no-prefix' presets
  @param include {boolean} - the value of the object properties for message prefix configuration
  @return {object} - a piece of settings, responsible for prefix configuration
**/
function configPrefix(include) {
  return {
    LOG_TIMESTAMP: include,
    LOG_ENVIRONMENT: include,
    LOG_LEVEL: include,
    LOG_REQID: include
  };
}

/**
  @function applyPreset
  @param preset {string} - a key name of a preset
  @param settings {object} - chain settings. This one is required to configure the chain links for 'dial-once' preset
  @return {object} - a piece of settings object based on the preset value
**/
function applyPreset(preset, settings) {
  let result = {};
  switch (preset) {
    case 'dial-once': {
      if (['staging', 'production'].includes(process.env.NODE_ENV)) {
        result = {
          CONSOLE_LOGGING: false,
          LOGENTRIES_LOGGING: true,
          BUGSNAG_LOGGING: true
        };
      } else {
        result = {
          CONSOLE_LOGGING: true,
          LOGENTRIES_LOGGING: false,
          BUGSNAG_LOGGING: false
        };
      }
      result.chainLinks = [logentries(settings), bugsnag(settings)];
      break;
    }
    case 'no-prefix': {
      result = configPrefix(false);
      break;
    }
    case 'prefix': {
      result = configPrefix(true);
      break;
    } default: {
      break;
    }
  }
  return result;
}

/**
  @param settings {Object} - chain settings
  @return settings object per the given presets
**/
module.exports = (settings) => {
  const presetConfigs = {};
  for (const preset of settings.presets) {
    Object.assign(presetConfigs, applyPreset(preset, settings));
  }
  return presetConfigs;
};
