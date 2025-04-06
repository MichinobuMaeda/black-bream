import { describe, it, expect } from "vitest";

import { locales, DaysOfWeek, I18n } from "../../src/i18n.js";

describe("DaysOfWeek", () => {
  it("should return short name of the given day of week.", () => {
    const dowEn = new DaysOfWeek("en");

    expect(dowEn.short(0)).toEqual("Su");
    expect(dowEn.short(1)).toEqual("Mo");
    expect(dowEn.short(2)).toEqual("Tu");
    expect(dowEn.short(3)).toEqual("We");
    expect(dowEn.short(4)).toEqual("Th");
    expect(dowEn.short(5)).toEqual("Fr");
    expect(dowEn.short(6)).toEqual("Sa");
    expect(dowEn.short(7)).toEqual("Su");

    const dowJa = new DaysOfWeek("ja");

    expect(dowJa.short(0)).toEqual("日");
    expect(dowJa.short(1)).toEqual("月");
    expect(dowJa.short(2)).toEqual("火");
    expect(dowJa.short(3)).toEqual("水");
    expect(dowJa.short(4)).toEqual("木");
    expect(dowJa.short(5)).toEqual("金");
    expect(dowJa.short(6)).toEqual("土");
    expect(dowJa.short(7)).toEqual("日");
  });

  it("should return middle length name of the given day of week.", () => {
    const dowEn = new DaysOfWeek("en");

    expect(dowEn.middle(0)).toEqual("Sun");
    expect(dowEn.middle(1)).toEqual("Mon");
    expect(dowEn.middle(2)).toEqual("Tue");
    expect(dowEn.middle(3)).toEqual("Wed");
    expect(dowEn.middle(4)).toEqual("Thu");
    expect(dowEn.middle(5)).toEqual("Fri");
    expect(dowEn.middle(6)).toEqual("Sat");
    expect(dowEn.middle(7)).toEqual("Sun");

    const dowJa = new DaysOfWeek("ja");

    expect(dowJa.middle(0)).toEqual("(日)");
    expect(dowJa.middle(1)).toEqual("(月)");
    expect(dowJa.middle(2)).toEqual("(火)");
    expect(dowJa.middle(3)).toEqual("(水)");
    expect(dowJa.middle(4)).toEqual("(木)");
    expect(dowJa.middle(5)).toEqual("(金)");
    expect(dowJa.middle(6)).toEqual("(土)");
    expect(dowJa.middle(7)).toEqual("(日)");
  });
  it("should return long name of the given day of week.", () => {
    const dowEn = new DaysOfWeek("en");

    expect(dowEn.long(0)).toEqual("Sunday");
    expect(dowEn.long(1)).toEqual("Monday");
    expect(dowEn.long(2)).toEqual("Tuesday");
    expect(dowEn.long(3)).toEqual("Wednesday");
    expect(dowEn.long(4)).toEqual("Thursday");
    expect(dowEn.long(5)).toEqual("Friday");
    expect(dowEn.long(6)).toEqual("Saturday");
    expect(dowEn.long(7)).toEqual("Sunday");

    const dowJa = new DaysOfWeek("ja");

    expect(dowJa.long(0)).toEqual("日曜日");
    expect(dowJa.long(1)).toEqual("月曜日");
    expect(dowJa.long(2)).toEqual("火曜日");
    expect(dowJa.long(3)).toEqual("水曜日");
    expect(dowJa.long(4)).toEqual("木曜日");
    expect(dowJa.long(5)).toEqual("金曜日");
    expect(dowJa.long(6)).toEqual("土曜日");
    expect(dowJa.long(7)).toEqual("日曜日");
  });
});

describe("i18n", () => {
  it("should return messages for all locales.", () => {
    locales.forEach((locale) => {
      const i18n = new I18n(locale.value);

      Object.getOwnPropertyNames(Object.getPrototypeOf(i18n))
        .filter((name) => name !== "constructor")
        .filter((name) => typeof i18n[name] === "function")
        .forEach((name) => {
          expect(i18n[name]()).toEqual(expect.any(String));
          expect(i18n[name]().length).toBeGreaterThan(0);
        });
    });
  });
});
