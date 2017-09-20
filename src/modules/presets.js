const path = require('path');

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
    LOG_REQID: include,
    LOG_CALLER_PREFIX: include
  };
}

function getCallerAppVersion(pwd = __dirname) {
  try {
    const callerModulePath = pwd.split(`${path.sep}node_modules`);
    let callerModulePackageJSON = '';
    // if contained node_modules
    if (callerModulePath.length > 1) {
      // part of the path before /node_modules
      callerModulePackageJSON = path.normalize(`${callerModulePath[0]}/package.json`);
    }

    if (callerModulePackageJSON) {
      const json = require(callerModulePackageJSON); // eslint-disable-line
      return json.version;
    }
  } catch (e) {} // eslint-disable-line
  console.warn('Unable to fetch caller module\'s version');
  return 'unknown';
}

/**
  @function applyPreset
  @param preset {string} - a key name of a preset
  @return {object} - a piece of settings object based on the preset value
**/
function applyPreset(preset) {
  switch (preset) {
    case 'dial-once': {
      const appVersion = getCallerAppVersion();
      if (['staging', 'production'].includes(process.env.NODE_ENV)) {
        return {
          CONSOLE_LOGGING: false,
          LOGENTRIES_LOGGING: true,
          LOGSTASH_LOGGING: true,
          BUGSNAG_LOGGING: true,
          JSONIFY: true,
          BUGSNAG_APP_VERSION: appVersion
        };
      }
      return {
        CONSOLE_LOGGING: true,
        LOGSTASH_LOGGING: false,
        LOGENTRIES_LOGGING: false,
        BUGSNAG_LOGGING: false,
        JSONIFY: true,
        BUGSNAG_APP_VERSION: appVersion
      };
    }
    case 'no-prefix': {
      return configPrefix(false);
    }
    case 'prefix': {
      return configPrefix(true);
    }
    case 'jsonify': {
      return { JSONIFY: true };
    }
    default: {
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

module.exports.getCallerAppVersion = getCallerAppVersion;
