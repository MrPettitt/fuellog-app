// Pin the time zone for every test worker so date tests behave the same on a
// developer machine in South Africa and on a CI runner in UTC.
module.exports = async () => {
  process.env.TZ = 'Africa/Johannesburg';
};
