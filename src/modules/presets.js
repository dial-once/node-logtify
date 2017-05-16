function configPrefix(include) {
  return {
    LOG_TIMESTAMP: include,
    LOG_ENVIRONMENT: include,
    LOG_LEVEL: include,
    LOG_REQID: include
  };
}

function applyPreset(preset) {
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

module.exports = (presets = []) => {
  const presetConfigs = {};
  for (const preset of presets) {
    Object.assign(presetConfigs, applyPreset(preset));
  }
  return presetConfigs;
};
