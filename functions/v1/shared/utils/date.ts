import { DateTime } from "luxon";

export const nowFrom1Month = (): Date => {
  return DateTime.now().plus({ months: 1 }).endOf("day").toJSDate();
};

export const nowUTC = (): Date => {
  return DateTime.now().toUTC().toJSDate();
};
