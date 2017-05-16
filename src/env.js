const DEFAULT_INSTANCE_ID = 1;

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
