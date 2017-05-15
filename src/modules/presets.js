function applyPreset(preset) {
  const result = {};
  switch (preset) {
    case 'dial-once': {
      if (['staging', 'production'].includes(process.env.NODE_ENV)) {
        process.env.CONSOLE_LOGGING = 'false';
        process.env.LOGENTRIES_LOGGING = 'true';
        process.env.BUGSNAG_LOGGING = 'true';
      } else {
        process.env.CONSOLE_LOGGING = 'true';
        process.env.LOGENTRIES_LOGGING = 'false';
        process.env.BUGSNAG_LOGGING = 'false';
      }
      break;
    }
    case 'no-prefix': {
      process.env.LOG_TIMESTAMP = 'false';
      process.env.LOG_ENVIRONMENT = 'false';
      process.env.LOG_LEVEL = 'false';
      process.env.LOG_REQID = 'false';
      break;
    } default: {
      break;
    }
  }
  return result;
}

module.exports = (presets = []) => {
  for (const preset of presets) {
    applyPreset(preset);
  }
};
