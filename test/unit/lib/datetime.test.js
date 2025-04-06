import {
  beforeAll,
  afterEach,
  afterAll,
  describe,
  it,
  expect,
  vi,
} from "vitest";

import {
  formatDateTime,
  formatLongDateTime,
  getNextPreDefinedSchedule,
} from "../../../src/lib/datetime.js";

Date.prototype.getTimezoneOffset = vi.fn();

const orgTz = process.env.TZ;
beforeAll(() => {
  process.env.TZ = "Asia/Tokyo";
});

afterEach(() => {
  vi.clearAllMocks();
});

afterAll(() => {
  process.env.TZ = orgTz;
});

describe("formatDateTime", () => {
  it(
    "should format a date object to YYYY-MM-DD HH:mm string" +
      " of the browser timezone.",
    () => {
      // Prepare
      Date.prototype.getTimezoneOffset.mockReturnValue(-540); // UTC+9
      const date = new Date("2000-01-01T00:00:00Z");

      // Execute and verify
      expect(formatDateTime(date)).toBe("2000-01-01 09:00");
    },
  );

  it("should return null for invalid date", () => {
    // Prepare
    const invalidDate = "invalid date";

    // Execute and verify
    expect(formatDateTime(invalidDate)).toBe(null);
  });
});

describe("formatLongDateTime", () => {
  it(
    "should format a date object to YYYY-MM-DD dow HH:mm string" +
      " of the browser timezone.",
    () => {
      // Prepare
      Date.prototype.getTimezoneOffset.mockReturnValue(-540); // UTC+9
      const date = new Date("2000-01-01T00:00:00Z");
      const dow = { short: () => "Sa" };

      // Execute and verify
      expect(formatLongDateTime(date, dow)).toBe("2000-01-01(Sa)09:00");
    },
  );

  it("should return null for invalid date", () => {
    // Prepare
    const invalidDate = "invalid date";
    const dow = { short: () => "Sa" };

    // Execute and verify
    expect(formatLongDateTime(invalidDate, dow)).toBe(null);
  });
});

describe("getNextPreDefinedSchedule", () => {
  it(
    "should get the next schedule from the predefined schedules" +
      " for delta:1 if base is later than now.",
    () => {
      // Prepare
      const delta = 1;
      const preDefined = {
        wd: [0, 1, 2, 3, 4],
        h: [9, 10],
        m: [13, 31],
      };
      // new Date("2050-01-01T00:00:00.000+0900").getDay() -> 6

      // Execute and verify #1
      expect(
        getNextPreDefinedSchedule(
          preDefined,
          "2050-01-01T00:00:00.000+0900",
          delta,
        ),
      ).toEqual(new Date("2050-01-02T09:13:00.000+0900"));

      // Execute and verify #2
      expect(
        getNextPreDefinedSchedule(
          preDefined,
          "2050-01-02T09:11:00.000+0900",
          delta,
        ),
      ).toEqual(new Date("2050-01-02T09:13:00.000+0900"));

      // Execute and verify #3
      expect(
        getNextPreDefinedSchedule(
          preDefined,
          "2050-01-02T09:14:00.000+0900",
          delta,
        ),
      ).toEqual(new Date("2050-01-02T09:31:00.000+0900"));

      // Execute and verify #4
      expect(
        getNextPreDefinedSchedule(
          preDefined,
          "2050-01-02T09:32:00.000+0900",
          delta,
        ),
      ).toEqual(new Date("2050-01-02T10:13:00.000+0900"));

      // Execute and verify #5
      expect(
        getNextPreDefinedSchedule(
          preDefined,
          "2050-01-02T10:32:00.000+0900",
          delta,
        ),
      ).toEqual(new Date("2050-01-03T09:13:00.000+0900"));
    },
  );

  it("should get nearly now for delta:1 if base is not later than now.", () => {
    // Prepare
    const delta = 1;
    const preDefined = {
      wd: [0, 1, 2, 3, 4],
      h: [9, 10],
      m: [13, 31],
    };
    const base = new Date(new Date().getTime() - 365 * 24 * 60 * 60 * 1000);

    // Execute
    const ret = getNextPreDefinedSchedule(
      preDefined,
      base.toISOString(),
      delta,
    );

    // Verify
    expect(ret.getTime()).toBeGreaterThanOrEqual(
      new Date().getTime() - 60 * 1000,
    );
    expect(ret.getTime()).toBeLessThanOrEqual(
      new Date().getTime() + 7 * 24 * 60 * 60 * 1000,
    );
  });

  it(
    "should get the next schedule from the predefined schedules" +
      " for delta:-1 if base is later than now.",
    () => {
      // Prepare
      const delta = -1;
      const preDefined = {
        wd: [0, 1, 2, 3, 4],
        h: [9, 10],
        m: [13, 31],
      };
      // new Date("2050-01-01T00:00:00.000+0900").getDay() -> 6

      // Execute and verify #1
      expect(
        getNextPreDefinedSchedule(
          preDefined,
          "2050-01-01T00:00:00.000+0900",
          delta,
        ),
      ).toEqual(new Date("2049-12-30T10:31:00.000+0900"));

      // Execute and verify #1
      expect(
        getNextPreDefinedSchedule(
          preDefined,
          "2049-12-30T10:32:00.000+0900",
          delta,
        ),
      ).toEqual(new Date("2049-12-30T10:31:00.000+0900"));

      // Execute and verify #2
      expect(
        getNextPreDefinedSchedule(
          preDefined,
          "2049-12-30T10:30:00.000+0900",
          delta,
        ),
      ).toEqual(new Date("2049-12-30T10:13:00.000+0900"));

      // Execute and verify #3
      expect(
        getNextPreDefinedSchedule(
          preDefined,
          "2049-12-30T10:12:00.000+0900",
          delta,
        ),
      ).toEqual(new Date("2049-12-30T09:31:00.000+0900"));

      // Execute and verify #4
      expect(
        getNextPreDefinedSchedule(
          preDefined,
          "2049-12-30T09:12:00.000+0900",
          delta,
        ),
      ).toEqual(new Date("2049-12-29T10:31:00.000+0900"));
    },
  );

  it("should get nearly now for delta:-1 if base is not later than now.", () => {
    // Prepare
    const delta = -1;
    const preDefined = {
      wd: [0, 1, 2, 3, 4],
      h: [9, 10],
      m: [13, 31],
    };
    const base = new Date(new Date().getTime() - 365 * 24 * 60 * 60 * 1000);

    // Execute
    const ret = getNextPreDefinedSchedule(
      preDefined,
      base.toISOString(),
      delta,
    );

    console.log("base", base);
    console.log("ret", ret);

    // Verify
    expect(ret.getTime()).toBeGreaterThanOrEqual(
      new Date().getTime() - 60 * 1000,
    );
    expect(ret.getTime()).toBeLessThanOrEqual(
      new Date().getTime() + 7 * 24 * 60 * 60 * 1000,
    );
  });
});
