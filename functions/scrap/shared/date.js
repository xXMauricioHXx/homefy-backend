const { DateTime } = require("luxon");

const nowFrom1Month = () => {
  return DateTime.now().plus({ months: 1 }).endOf("day").toJSDate();
};

const nowUTC = () => {
  return DateTime.now().toUTC().toJSDate();
};

module.exports = {
  nowFrom1Month,
  nowUTC,
};
