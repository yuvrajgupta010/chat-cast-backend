const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezone);

const START_TIME = dayjs().tz("Asia/Kolkata").format("DD-MMM-YYYY hh:mm:ss A");

const date5MinutesAgoFn = () => {
  const minutesAgo = 5;
  const date5MinutesAgo = new Date(new Date() - minutesAgo * 60 * 1000);
  return date5MinutesAgo;
};

module.exports = {
  START_TIME,
  date5MinutesAgoFn,
};
