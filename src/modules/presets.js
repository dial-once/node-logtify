/**
  @function configPrefix
  return a piece of settings object, configured by a 'prefix' or 'no-prefix' presets
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
  @return {object} - a piece of settings object based on the preset value
**/
function applyPreset(preset) {
  switch (preset) {
    case 'dial-once': {
      if (['staging', 'production'].includes(process.env.NODE_ENV)) {
        return {
          CONSOLE_LOGGING: false,
          LOGENTRIES_LOGGING: true,
          BUGSNAG_LOGGING: true
        };
      }
      return {
        CONSOLE_LOGGING: true,
        LOGENTRIES_LOGGING: false,
        BUGSNAG_LOGGING: false
      };
    }
    case 'no-prefix': {
      return configPrefix(false);
    }
    case 'prefix': {
      return configPrefix(true);
    } default: {
      return {};
    }
  }
}

/**
  @param settings {Object} - chain settings
  @return settings object per the given presets
**/
module.exports = (settings) => {
  const presetConfigs = {};
  for (const preset of settings.presets) {
    Object.assign(presetConfigs, applyPreset(preset));
  }
  return presetConfigs;
};
