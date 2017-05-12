const DEFAULT_INSTANCE_ID = 1;

if (process.env.NODE_ENV !== 'production') {
  process.env.CONSOLE_LOGGING = 'true';
}

process.env.MIN_LOG_LEVEL = 'info';
process.env.LOG_TIMESTAMP = 'true';
process.env.LOG_ENVIRONMENT = 'true';
process.env.LOG_LEVEL = 'true';
process.env.LOG_REQID = 'true';

if (!process.env.HOSTNAME) {
  process.env.HOSTNAME = process.env.USER;
  process.env.INSTANCE_NUMBER = 0;
} else {
  // if this instance is workflow-1, the instance number is 0
  const instanceNumber = process.env.HOSTNAME.split('-');
  if (instanceNumber.length === 1) {
    instanceNumber.push(DEFAULT_INSTANCE_ID);
  }

  process.env.INSTANCE_NUMBER = parseInt(instanceNumber[instanceNumber.length - 1], 10);
}
