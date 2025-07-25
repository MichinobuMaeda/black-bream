import { afterEach, describe, it, expect, vi } from "vitest";
import { add } from "date-fns";
import { Timestamp } from "firebase/firestore";

import { LocalizedDateTime } from "../../../src/lib/datetime.js";

afterEach(() => {
  vi.clearAllMocks();
});

describe("LocalizedDateTime's constructor", () => {
  it("should set given value, locale and schedule.", () => {
    // Prepare
    const iso = "2020-01-01T00:00:00.000Z";
    const sch = { wd: [1, 2, 3], h: [4, 5, 6], m: [7, 8, 9] };
    const tz = "Asia/Bangkok";

    // Execute
    const ldt = new LocalizedDateTime(new Date(iso), "ja", tz, sch);

    // Verify
    expect(ldt.locale).toBe("ja");
    expect(ldt.tz).toBe(tz);
    expect(ldt.sch).toEqual(sch);
    expect(ldt.dt.getTime()).toEqual(new Date(iso).getTime());
  });
});

describe("LocalizedDateTime.factory", () => {
  it("should set the given value: 'YYYY-MM-DD' as system timezone.", () => {
    // Prepare
    const seed = "2020-01-01";
    const sch = { wd: [1, 2, 3], h: [4, 5, 6], m: [7, 8, 9] };
    const conf = {
      tz: "Asia/Bangkok",
      preDefinedSchedules: sch,
    };

    // Execute
    const ldt = LocalizedDateTime.factory("ja", conf, seed);

    // Verify
    expect(ldt.locale).toBe("ja");
    expect(ldt.sch).toEqual(sch);
    expect(ldt.dt.toISOString()).toEqual("2020-01-01T00:00:00.000+07:00");
  });

  it("should set the given value: 'YYYY-MM-DD HH:mm' as system timezone.", () => {
    // Prepare
    const seed = "2020-01-01 12:00";
    const sch = { wd: [1, 2, 3], h: [4, 5, 6], m: [7, 8, 9] };
    const conf = {
      tz: "Asia/Bangkok",
      preDefinedSchedules: sch,
    };

    // Execute
    const ldt = LocalizedDateTime.factory("ja", conf, seed);

    // Verify
    expect(ldt.locale).toBe("ja");
    expect(ldt.sch).toEqual(sch);
    expect(ldt.dt.toISOString()).toEqual("2020-01-01T12:00:00.000+07:00");
  });

  it("should set the given value: 'YYYY-MM-DD HH:mm' as system timezone.", () => {
    // Prepare
    const seed = "2020-01-01 12:00:01";
    const sch = { wd: [1, 2, 3], h: [4, 5, 6], m: [7, 8, 9] };
    const conf = {
      tz: "Asia/Bangkok",
      preDefinedSchedules: sch,
    };

    // Execute
    const ldt = LocalizedDateTime.factory("ja", conf, seed);

    // Verify
    expect(ldt.locale).toBe("ja");
    expect(ldt.sch).toEqual(sch);
    expect(ldt.dt.toISOString()).toEqual("2020-01-01T12:00:01.000+07:00");
  });

  it("should set the given value: 1500000000000.", () => {
    // Prepare
    const seed = 1500000000000;
    const expected = new Date(seed);
    const sch = { wd: [1, 2, 3], h: [4, 5, 6], m: [7, 8, 9] };
    const conf = {
      tz: "Asia/Tokyo",
      preDefinedSchedules: sch,
    };

    // Execute
    const ldt = LocalizedDateTime.factory("ja", conf, seed);

    // Verify
    expect(ldt.locale).toBe("ja");
    expect(ldt.sch).toEqual(sch);
    expect(ldt.dt.getTime()).toEqual(expected.getTime());
  });

  it("should set the given value: 1600000000.", () => {
    // Prepare
    const seed = 1500000000000;
    const expected = new Date(seed);
    const sch = { wd: [1, 2, 3], h: [4, 5, 6], m: [7, 8, 9] };
    const conf = {
      tz: "Asia/Tokyo",
      preDefinedSchedules: sch,
    };

    // Execute
    const ldt = LocalizedDateTime.factory("ja", conf, seed);

    // Verify
    expect(ldt.locale).toBe("ja");
    expect(ldt.sch).toEqual(sch);
    expect(ldt.dt.getTime()).toEqual(expected.getTime());
  });

  it("should set the given value: 99999999999.", () => {
    // Prepare
    const seed = 99999999999;
    const expected = new Date(seed * 1000);
    const sch = { wd: [1, 2, 3], h: [4, 5, 6], m: [7, 8, 9] };
    const conf = {
      tz: "Asia/Tokyo",
      preDefinedSchedules: sch,
    };

    // Execute
    const ldt = LocalizedDateTime.factory("ja", conf, seed);

    // Verify
    expect(ldt.locale).toBe("ja");
    expect(ldt.sch).toEqual(sch);
    expect(ldt.dt.getTime()).toEqual(expected.getTime());
  });

  it("should set the given instance of Date.", () => {
    // Prepare
    const seed = new Date("2020-02-22T00:00:00.000Z");
    const iso = "2020-02-22T00:00:00.000Z";
    const sch = { wd: [1, 2, 3], h: [4, 5, 6], m: [7, 8, 9] };
    const conf = {
      tz: "Asia/Tokyo",
      preDefinedSchedules: sch,
    };

    // Execute
    const ldt = LocalizedDateTime.factory("ja", conf, seed);

    // Verify
    expect(ldt.locale).toBe("ja");
    expect(ldt.sch).toEqual(sch);
    expect(ldt.dt).toEqual(new Date(iso));
  });

  it("should set the given instance of Timestamp.", () => {
    // Prepare
    const seed = Timestamp.fromDate(new Date("2020-02-22T00:00:00.000Z"));
    const iso = "2020-02-22T00:00:00.000Z";
    const sch = { wd: [1, 2, 3], h: [4, 5, 6], m: [7, 8, 9] };
    const conf = {
      tz: "Asia/Tokyo",
      preDefinedSchedules: sch,
    };

    // Execute
    const ldt = LocalizedDateTime.factory("ja", conf, seed);

    // Verify
    expect(ldt.locale).toBe("ja");
    expect(ldt.sch).toEqual(sch);
    expect(ldt.dt.getTime()).toEqual(new Date(iso).getTime());
  });

  it("should set current system timezone without given value.", () => {
    // Prepare
    const sch = { wd: [1, 2, 3], h: [4, 5, 6], m: [7, 8, 9] };
    const conf = {
      tz: "Asia/Tokyo",
      preDefinedSchedules: sch,
    };

    // Execute
    const ldt = LocalizedDateTime.factory("ja", conf);

    // Verify
    expect(ldt.locale).toBe("ja");
    expect(ldt.sch).toEqual(sch);
    expect(ldt.dt.getTime()).toBeLessThanOrEqual(new Date().getTime());
    expect(ldt.dt.getTime()).toBeGreaterThan(new Date().getTime() - 100);
  });

  it("should return undefined with invalid given value.", () => {
    // Prepare
    const sch = { wd: [1, 2, 3], h: [4, 5, 6], m: [7, 8, 9] };
    const conf = {
      tz: "Asia/Tokyo",
      preDefinedSchedules: sch,
    };

    // Execute
    const ldt = LocalizedDateTime.factory("ja", conf, {});

    // Verify
    expect(ldt.locale).toBe("ja");
    expect(ldt.sch).toEqual(sch);
    expect(ldt.dt).toBeUndefined();
  });
});

describe("formatDate()", () => {
  it("should format date to YYYY-MM-DD.", () => {
    // Prepare
    const seed = "2020-02-22";
    const sch = { wd: [1, 2, 3], h: [4, 5, 6], m: [7, 8, 9] };
    const conf = {
      tz: "Asia/Tokyo",
      preDefinedSchedules: sch,
    };
    const ldt = LocalizedDateTime.factory("ja", conf, seed);

    // Execute
    const result = ldt.formatDate();

    // Verify
    expect(result).toBe("2020-02-22");
  });
});

describe("formatDateTime()", () => {
  it("should format date and time to YYYY-MM-DD HH:mm.", () => {
    // Prepare
    const seed = "2020-02-22 00:00";
    const sch = { wd: [1, 2, 3], h: [4, 5, 6], m: [7, 8, 9] };
    const ldt = LocalizedDateTime.factory("ja", sch, seed);

    // Execute
    const result = ldt.formatDateTime();

    // Verify
    expect(result).toBe("2020-02-22 00:00");
  });
});

describe("formatDateTimeLong()", () => {
  it("should format date and time to YYYY-MM-DD(dd)HH:mm for locale: ja.", () => {
    // Prepare
    const seed = "2020-02-22 00:00";
    const sch = { wd: [1, 2, 3], h: [4, 5, 6], m: [7, 8, 9] };
    const conf = {
      tz: "Asia/Tokyo",
      preDefinedSchedules: sch,
    };
    const ldt = LocalizedDateTime.factory("ja", conf, seed);

    // Execute
    const result = ldt.formatDateTimeLong();

    // Verify
    expect(result).toBe("2020-02-22(土)00:00");
  });
  it("should format date and time to YYYY-MM-DD(dd)HH:mm for locale: en.", () => {
    // Prepare
    const seed = "2020-02-22 00:00";
    const sch = { wd: [1, 2, 3], h: [4, 5, 6], m: [7, 8, 9] };
    const conf = {
      tz: "Asia/Tokyo",
      preDefinedSchedules: sch,
    };
    const ldt = LocalizedDateTime.factory("en", conf, seed);

    // Execute
    const result = ldt.formatDateTimeLong();

    // Verify
    expect(result).toBe("2020-02-22(Sa)00:00");
  });
});

describe("getNextOrPreviousSchedule()", () => {
  it(
    "should not get the next schedule" +
      " if any member of schedules object is empty.",
    () => {
      // Prepare
      const seed = add(new Date(), { days: 7 - new Date().getDay() });
      console.log(seed.getDay());

      {
        // Prepare #1
        const sch = { wd: [], h: [4, 6, 8], m: [9, 11, 13] };
        const conf = {
          tz: "Asia/Tokyo",
          preDefinedSchedules: sch,
        };

        // Execute #1
        const ldt = LocalizedDateTime.factory("ja", conf, seed);

        // Verify #1
        expect(ldt.getPrevSchedule()).toBe(ldt);
        expect(ldt.getNextSchedule()).toBe(ldt);
      }

      {
        // Prepare #2
        const sch = { wd: [1, 2, 3], h: [], m: [9, 11, 13] };
        const conf = {
          tz: "Asia/Tokyo",
          preDefinedSchedules: sch,
        };

        // Execute #2
        const ldt = LocalizedDateTime.factory("ja", conf, seed);

        // Verify #2
        expect(ldt.getPrevSchedule()).toBe(ldt);
        expect(ldt.getNextSchedule()).toBe(ldt);
      }

      {
        // Prepare #3
        const sch = { wd: [1, 2, 3], h: [4, 6, 8], m: [] };
        const conf = {
          tz: "Asia/Tokyo",
          preDefinedSchedules: sch,
        };

        // Execute #3
        const ldt = LocalizedDateTime.factory("ja", conf, seed);

        // Verify #3
        expect(ldt.getPrevSchedule()).toBe(ldt);
        expect(ldt.getNextSchedule()).toBe(ldt);
      }
    },
  );

  it("should return the previous schedule.", () => {
    // Prepare
    const sch = { wd: [1, 2, 3], h: [4, 6, 8], m: [9, 11, 13] };
    const conf = {
      tz: "Europe/Berlin",
      preDefinedSchedules: sch,
    };

    {
      // Prepare #1
      const seed = add(new Date(), { days: -10 });
      const ldt = LocalizedDateTime.factory("ja", conf, seed);

      // Execute #1
      const prv = ldt.getPrevSchedule();

      // Verify #1
      expect(prv.dt.getTime()).toBeLessThanOrEqual(
        add(new Date(), { minutes: 1 }).getTime(),
      );
      expect(prv.dt.getTime()).toBeGreaterThanOrEqual(
        add(new Date(), { minutes: -1 }).getTime(),
      );
    }

    {
      // Prepare #2
      const seed = add(new Date(), { days: 14 - new Date().getDay() });
      const ldt = LocalizedDateTime.factory("ja", conf, seed);

      // Execute #2-1
      const prv1 = ldt.getPrevSchedule();

      // Verify #2-1
      expect(prv1.dt.getDay()).toBe(3);
      expect(prv1.dt.getHours()).toBe(8);
      expect(prv1.dt.getMinutes()).toBe(13);

      // Execute #2-2
      const prv2 = prv1.getPrevSchedule();

      // Verify #2-2
      expect(prv2.dt.getDay()).toBe(3);
      expect(prv2.dt.getHours()).toBe(8);
      expect(prv2.dt.getMinutes()).toBe(11);

      // Execute #2-3
      const prv3 = prv2.getPrevSchedule();

      // Verify #2-3
      expect(prv3.dt.getDay()).toBe(3);
      expect(prv3.dt.getHours()).toBe(8);
      expect(prv3.dt.getMinutes()).toBe(9);

      // Execute #2-4
      const prv4 = prv3.getPrevSchedule();

      // Verify #2-4
      expect(prv4.dt.getDay()).toBe(3);
      expect(prv4.dt.getHours()).toBe(6);
      expect(prv4.dt.getMinutes()).toBe(13);
    }
  });

  it("should return the next schedule.", () => {
    // Prepare
    const sch = { wd: [1, 2, 3], h: [4, 6, 8], m: [9, 11, 13] };
    const conf = {
      tz: "Europe/Berlin",
      preDefinedSchedules: sch,
    };

    {
      // Prepare #1
      const seed = add(new Date(), { days: -10 });
      const ldt = LocalizedDateTime.factory("ja", conf, seed);

      // Execute #1
      const nxt = ldt.getNextSchedule();

      // Verify #1
      expect(nxt.dt.getTime()).toBeLessThanOrEqual(
        add(new Date(), { minutes: 1 }).getTime(),
      );
      expect(nxt.dt.getTime()).toBeGreaterThanOrEqual(
        add(new Date(), { minutes: -1 }).getTime(),
      );
    }

    {
      // Prepare #2
      const seed = add(new Date(), { days: 7 - new Date().getDay() });
      const ldt = LocalizedDateTime.factory("ja", conf, seed);

      // Execute #2-1
      const nxt1 = ldt.getNextSchedule();

      // Verify #2-1
      expect(nxt1.dt.getDay()).toBe(1);
      expect(nxt1.dt.getHours()).toBe(4);
      expect(nxt1.dt.getMinutes()).toBe(9);

      // Execute #2-2
      const nxt2 = nxt1.getNextSchedule();

      // Verify #2-2
      expect(nxt2.dt.getDay()).toBe(1);
      expect(nxt2.dt.getHours()).toBe(4);
      expect(nxt2.dt.getMinutes()).toBe(11);

      // Execute #2-3
      const nxt3 = nxt2.getNextSchedule();

      // Verify #2-3
      expect(nxt3.dt.getDay()).toBe(1);
      expect(nxt3.dt.getHours()).toBe(4);
      expect(nxt3.dt.getMinutes()).toBe(13);

      // Execute #2-4
      const nxt4 = nxt3.getNextSchedule();

      // Verify #2-4
      expect(nxt4.dt.getDay()).toBe(1);
      expect(nxt4.dt.getHours()).toBe(6);
      expect(nxt4.dt.getMinutes()).toBe(9);
    }
  });
});
