const { DateTime } = require("luxon");

const nowFrom1Month = () => {
  return DateTime.now().plus({ months: 1 }).toJSDate();
};

module.exports = {
  nowFrom1Month,
};
