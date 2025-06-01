import { describe, it, expect, afterEach, vi } from "vitest";
import { TZDate } from "@date-fns/tz";
import { Timestamp, FieldValue } from "firebase-admin/firestore";
// import { httpRequest } from "./utils";
import { FeedHandler } from "./feedHandler.js";
import { get } from "svelte/store";
import { DEFAULT_TZ } from "./utils.js";

const templates = [
  {
    id: "template1",
    data: () => ({
      feed: "http://example.com/testFeed",
      category: "testCategory",
      targets: ["target1", "target2"],
    }),
  },
  {
    id: "template2",
    data: () => ({
      feed: "http://example.com/anotherFeed",
      category: "anotherCategory",
      targets: ["target1"],
      deletedAt: null,
    }),
  },
  {
    id: "emptyFeedTemplate",
    data: () => ({
      // feed: "http://example.com/anotherFeed",
      category: "anotherCategory",
      targets: ["target1"],
      deletedAt: null,
    }),
  },
  {
    id: "emptyCategoryTemplate",
    data: () => ({
      feed: "http://example.com/anotherFeed",
      // category: "anotherCategory",
      targets: ["target1"],
      deletedAt: null,
    }),
  },
  {
    id: "emptyTargetsTemplate",
    data: () => ({
      feed: "http://example.com/anotherFeed",
      category: "anotherCategory",
      // targets: ["target1"],
      deletedAt: null,
    }),
  },
  {
    id: "deletedTemplate",
    data: () => ({
      feed: "http://example.com/anotherFeed",
      category: "anotherCategory",
      targets: ["target2"],
      deletedAt: Timestamp.fromDate(new Date("2023-01-01T00:00:00Z")),
    }),
  },
];

const feeds = [
  {
    id: "feed1",
    data: () => ({
      feed: "http://example.com/testFeed",
      category: "testCategory",
      status: "new",
      title: "Test Feed #1",
    }),
  },
  {
    id: "feed2",
    data: () => ({
      feed: "http://example.com/testFeed",
      category: "testCategory",
      status: "new",
      title: "Test Feed #2",
    }),
  },
  {
    id: "feed3",
    data: () => ({
      feed: "http://example.com/anotherFeed",
      category: "testCategory",
      status: "new",
      title: "Test Feed #2",
    }),
  },
  {
    id: "feed4",
    data: () => ({
      feed: "http://example.com/testFeed",
      category: "anotherCategory",
      status: "new",
      title: "Test Feed #2",
    }),
  },
];

const refMock = {
  get: vi.fn(() => ({ exists: false })),
  set: vi.fn(),
  update: vi.fn(),
};
const whereMock = {
  get: vi.fn(() => Promise.resolve({ docs: feeds })),
};
const collectionMock = {
  doc: vi.fn(() => refMock),
  get: vi.fn(() => Promise.resolve({ docs: templates })),
  add: vi.fn(() => Promise.resolve({})),
  where: vi.fn(() => whereMock),
};
const db = { collection: vi.fn(() => collectionMock) };

afterEach(() => {
  vi.clearAllMocks();
});

describe("getFeedTemplates()", () => {
  it("should return feed templates", async () => {
    // Prepare

    // Execute
    const templates = await new FeedHandler(db).getFeedTemplates();

    // Verify
    expect(templates).toEqual([
      {
        id: "template1",
        feed: "http://example.com/testFeed",
        category: "testCategory",
        targets: ["target1", "target2"],
      },
      {
        id: "template2",
        feed: "http://example.com/anotherFeed",
        category: "anotherCategory",
        targets: ["target1"],
        deletedAt: null,
      },
    ]);
  });
});

describe("getFeedTargets()", () => {
  it("should return unique feed and category pairs", () => {
    // Prepare
    const templates = [
      { feed: "feed1", category: "cat1" },
      { feed: "feed1", category: "cat2" },
      { feed: "feed2", category: "cat2" },
      { feed: "feed3", category: "cat1" },
      { feed: "feed3", category: "cat1" },
    ];

    // Execute
    const targets = new FeedHandler(db).getFeedTargets(templates);

    // Verify
    expect(targets).toEqual([
      { feed: "feed1", category: "cat1" },
      { feed: "feed1", category: "cat2" },
      { feed: "feed2", category: "cat2" },
      { feed: "feed3", category: "cat1" },
    ]);
  });
});

describe("getFeedTemplate()", () => {
  it("should return a random template for a specific feed and category", () => {
    // Prepare
    const templates = [
      { id: "1", feed: "feed1", category: "cat1" },
      { id: "2", feed: "feed1", category: "cat1" },
      { id: "3", feed: "feed2", category: "cat2" },
    ];
    const target = { feed: "feed1", category: "cat1" };

    // Execute
    const template = new FeedHandler(db).getFeedTemplate(templates, target);

    // Verify
    expect(template).toEqual(
      expect.objectContaining({
        feed: "feed1",
        category: "cat1",
      }),
    );
  });

  it("should return an empty object if no template matches the feed and category", () => {
    // Prepare
    const templates = [
      { id: "1", feed: "feed1", category: "cat1" },
      { id: "2", feed: "feed2", category: "cat2" },
    ];
    const target = { feed: "feed3", category: "cat3" };

    // Execute
    const template = new FeedHandler(db).getFeedTemplate(templates, target);

    // Verify
    expect(template).toEqual({});
  });
});

describe("getFeeds() with empty fields", () => {
  it("should return templates with empty fields", async () => {
    // Prepare
    const target = {
      feed: "http://example.com/testFeed",
      category: "testCategory",
    };

    // Execute
    const result = await new FeedHandler(db).getFeeds(
      target.feed,
      target.category,
    );

    // Verify
    expect(result).toEqual([
      {
        id: "feed1",
        feed: "http://example.com/testFeed",
        category: "testCategory",
        status: "new",
        title: "Test Feed #1",
      },
      {
        id: "feed2",
        feed: "http://example.com/testFeed",
        category: "testCategory",
        status: "new",
        title: "Test Feed #2",
      },
    ]);
  });
});

describe("getNextSchedule()", () => {
  it("should return the next schedule for a given timezone and predefined schedule", () => {
    // Prepare
    const tz = "Asia/Bangkok";
    const base = new TZDate(2000, 0, 1, tz);
    const preDefined = {
      wd: [1, 2],
      h: [3, 4],
      m: [5, 6],
    };

    // Execute
    const nextSchedule = new FeedHandler(db).getNextSchedule(
      tz,
      base,
      preDefined,
    );

    // Verify
    expect(nextSchedule).toEqual(new TZDate(2000, 0, 3, 3, 5, tz));
  });

  it("should return the current date if no predefined schedule is provided", () => {
    // Prepare
    const tz = "Asia/Bangkok";
    const base = new TZDate(2000, 0, 1, tz);
    const preDefined = {};

    // Execute
    const nextSchedule = new FeedHandler(db).getNextSchedule(
      tz,
      base,
      preDefined,
    );

    // Verify
    expect(nextSchedule).toEqual(new TZDate(2000, 0, 1, tz));
  });
});

describe("getFeedHandleSchedule()", () => {
  it("should return a valid schedule for the feed handling", () => {
    // Prepare
    const tz = "Asia/Bangkok";
    const preDefined = {
      wd: [1, 2],
      h: [3, 4],
      m: [5, 6],
    };

    // Execute
    const schedule = new FeedHandler(db).getFeedHandleSchedule(tz, preDefined);

    // Verify
    expect(schedule).toBeInstanceOf(Date);
    expect(schedule.getTime()).toBeGreaterThan(new Date().getTime());
  });

  it("should return the current date if no predefined schedule is provided", () => {
    // Prepare
    const tz = "Asia/Bangkok";
    const preDefined = {};

    // Execute
    const schedule = new FeedHandler(db).getFeedHandleSchedule(tz, preDefined);

    // Verify
    expect(schedule).toBeInstanceOf(Date);
    expect(schedule.getTime()).toBeGreaterThanOrEqual(new Date().getTime());
    expect(schedule.getTime()).toBeLessThanOrEqual(
      new Date().getTime() + 120000,
    );
  });
});

describe("applyTemplate()", () => {
  it("should apply a template without title to a feed", () => {
    // Prepare
    const feeds = [
      {
        id: "feed1",
        feed: "http://example.com/testFeed",
        category: "testCategory",
        status: "new",
        title: "Test Feed #1",
      },
      {
        id: "feed2",
        feed: "http://example.com/testFeed",
        category: "testCategory",
        status: "new",
        title: "Test Feed #2",
      },
    ];
    const text = `
Line 1
Line 2

Line 4
`;

    // Execute
    const result = new FeedHandler(db).applyTemplate(text, feeds);

    // Verify
    expect(result).toEqual(
      `
Line 1
Line 2

Line 4
`,
    );
  });
  it("should apply a template with title to a feed", () => {
    // Prepare
    const feeds = [
      {
        id: "feed1",
        feed: "http://example.com/testFeed",
        category: "testCategory",
        status: "new",
        title: "Test Feed #1",
      },
      {
        id: "feed2",
        feed: "http://example.com/testFeed",
        category: "testCategory",
        status: "new",
        title: "Test Feed #2",
      },
    ];
    const text = `
Line {{ title }}
Line 2

Line 4
`;

    // Execute
    const result = new FeedHandler(db).applyTemplate(text, feeds);

    // Verify
    expect(result).toEqual(
      `
Line Test Feed #1
Line Test Feed #2
Line 2

Line 4
`,
    );
  });
});

describe("handleFeedAndCategory()", () => {
  it("should skip processing for the templates without text", async () => {
    // Prepare
    FeedHandler.prototype.getFeeds = vi.fn(() => Promise.resolve([]));
    const template = {
      name: "Template 1",
      text: "",
      targets: [{}],
    };
    const sysTz = "Asia/Tokyo";
    const preDefined = {};
    const target = {
      feed: "http://example.com/testFeed",
      category: "testCategory",
    };

    // Execute
    await new FeedHandler(db).handleFeedAndCategory(
      template,
      sysTz,
      preDefined,
      target,
    );

    // Verify
    expect(FeedHandler.prototype.getFeeds).not.toHaveBeenCalled();
  });

  it("should skip processing for the templates without target", async () => {
    // Prepare #1
    FeedHandler.prototype.getFeeds = vi.fn(() => Promise.resolve([]));
    const template1 = {
      name: "Template 1",
      text: "Text for template",
      targets: [],
    };
    const sysTz = "Asia/Tokyo";
    const preDefined = {};
    const target = {
      feed: "http://example.com/testFeed",
      category: "testCategory",
    };

    // Execute #1
    await new FeedHandler(db).handleFeedAndCategory(
      template1,
      sysTz,
      preDefined,
      target,
    );

    // Prepare #2
    const template2 = {
      name: "Template 1",
      text: "Text for template",
    };
    // Execute #2
    await new FeedHandler(db).handleFeedAndCategory(
      template2,
      sysTz,
      preDefined,
      target,
    );

    // Verify
    expect(FeedHandler.prototype.getFeeds).not.toHaveBeenCalled();
  });

  it("should skip processing if no feeds are found", async () => {
    // Prepare #1
    FeedHandler.prototype.getFeeds = vi.fn(() => Promise.resolve([]));
    FeedHandler.prototype.getFeedHandleSchedule = vi.fn(() => new Date());
    const template = {
      name: "Template 1",
      text: "Text for template",
      targets: [{}],
    };
    const sysTz = "Asia/Tokyo";
    const preDefined = {};
    const target = {
      feed: "http://example.com/testFeed",
      category: "testCategory",
    };

    // Execute #1
    await new FeedHandler(db).handleFeedAndCategory(
      template,
      sysTz,
      preDefined,
      target,
    );

    // Prepare #2
    FeedHandler.prototype.getFeeds.mockResolvedValueOnce(null);

    // Execute #2
    await new FeedHandler(db).handleFeedAndCategory(
      template,
      sysTz,
      preDefined,
      target,
    );

    // Verify
    expect(FeedHandler.prototype.getFeeds.mock.calls).toEqual([
      [target.feed, target.category],
      [target.feed, target.category],
    ]);
    expect(FeedHandler.prototype.getFeedHandleSchedule).not.toHaveBeenCalled();
  });

  it("should process the template and add a post", async () => {
    // Prepare
    FeedHandler.prototype.getFeeds = vi.fn(() =>
      Promise.resolve([
        {
          id: "feed1",
          feed: "http://example.com/testFeed",
          category: "testCategory",
          status: "new",
          title: "Test Feed #1",
        },
        {
          id: "feed2",
          feed: "http://example.com/testFeed",
          category: "testCategory",
          status: "new",
          title: "Test Feed #2",
        },
      ]),
    );
    FeedHandler.prototype.getFeedHandleSchedule = vi.fn(
      () => new Date("2023-01-01T00:00:00Z"),
    );
    const template = {
      name: "Template 1",
      text: "Text for template",
      targets: [{}],
    };
    const sysTz = "Asia/Tokyo";
    const preDefined = {};
    const target = {
      feed: "http://example.com/testFeed",
      category: "testCategory",
    };

    // Execute
    await new FeedHandler(db).handleFeedAndCategory(
      template,
      sysTz,
      preDefined,
      target,
    );

    // Verify
    expect(FeedHandler.prototype.getFeeds.mock.calls).toEqual([
      [target.feed, target.category],
    ]);
    expect(FeedHandler.prototype.getFeedHandleSchedule.mock.calls).toEqual([
      [sysTz, preDefined],
    ]);
    expect(db.collection.mock.calls).toEqual([["posts"], ["feeds"], ["feeds"]]);
    expect(collectionMock.add.mock.calls).toEqual([
      [
        {
          text: template.text,
          files: [],
          targets: [{}],
          scheduledFor: new Date("2023-01-01T00:00:00Z"),
          status: "requested",
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
      ],
    ]);
    expect(collectionMock.doc.mock.calls).toEqual([["feed1"], ["feed2"]]);
    expect(refMock.update.mock.calls).toEqual([
      [
        {
          status: "handled",
          updatedAt: FieldValue.serverTimestamp(),
        },
      ],
      [
        {
          status: "handled",
          updatedAt: FieldValue.serverTimestamp(),
        },
      ],
    ]);
  });

  it("should handle errors during feed processing", async () => {
    // Prepare
    FeedHandler.prototype.getFeeds = vi.fn(() =>
      Promise.reject(new Error("Database error")),
    );
    const template = {
      name: "Template 1",
      text: "Text for template",
      targets: [{}],
    };
    const sysTz = "Asia/Tokyo";
    const preDefined = {};
    const target = {
      feed: "http://example.com/testFeed",
      category: "testCategory",
    };

    // Execute
    const result = await new FeedHandler(db).handleFeedAndCategory(
      template,
      sysTz,
      preDefined,
      target,
    );

    // Verify
    expect(result).toEqual({
      err: `Error processing feed: ${target.feed}, category: ${target.category}`,
    });
  });
});

describe("handleFeeds()", () => {
  const conf = {
    exists: true,
    get: vi.fn(),
  };
  const preDefinedSchedules = {
    wd: [1, 2],
    h: [3, 4],
    m: [5, 6],
  };

  it("should handle feeds and categories", async () => {
    // Prepare
    conf.get
      .mockReturnValueOnce("Asia/Bangkok")
      .mockReturnValueOnce(preDefinedSchedules);
    refMock.get.mockResolvedValue(conf);
    FeedHandler.prototype.getFeedTemplate = vi.fn();
    FeedHandler.prototype.handleFeedAndCategory = vi.fn(() =>
      Promise.resolve({}),
    );
    FeedHandler.prototype.getFeedTemplate
      .mockReturnValueOnce({ name: "Template 1" })
      .mockReturnValueOnce({ name: "Template 2" });
    FeedHandler.prototype.getFeedTemplates = vi.fn(() =>
      Promise.resolve(templates),
    );
    FeedHandler.prototype.getFeedTargets = vi.fn(() => [
      { feed: "http://example.com/testFeed", category: "testCategory" },
      { feed: "http://example.com/anotherFeed", category: "anotherCategory" },
    ]);

    // Execute
    const result = await new FeedHandler(db).handleFeeds();

    // Verify
    expect(db.collection.mock.calls).toEqual([["service"]]);
    expect(collectionMock.doc.mock.calls).toEqual([["conf"]]);
    expect(refMock.get.mock.calls).toEqual([[]]);
    expect(conf.get.mock.calls).toEqual([["tz"], ["preDefinedSchedules"]]);
    expect(FeedHandler.prototype.getFeedTemplates.mock.calls).toEqual([[]]);
    expect(FeedHandler.prototype.getFeedTargets.mock.calls).toEqual([
      [templates],
    ]);
    expect(FeedHandler.prototype.getFeedTemplate.mock.calls).toEqual([
      [
        templates,
        { feed: "http://example.com/testFeed", category: "testCategory" },
      ],
      [
        templates,
        { feed: "http://example.com/anotherFeed", category: "anotherCategory" },
      ],
    ]);
    expect(FeedHandler.prototype.handleFeedAndCategory.mock.calls).toEqual([
      [
        { name: "Template 1" },
        "Asia/Bangkok",
        preDefinedSchedules,
        { feed: "http://example.com/testFeed", category: "testCategory" },
      ],
      [
        { name: "Template 2" },
        "Asia/Bangkok",
        preDefinedSchedules,
        { feed: "http://example.com/anotherFeed", category: "anotherCategory" },
      ],
    ]);
    expect(result).toEqual({ err: undefined });
  });

  it("should handle feeds and categories with default tz", async () => {
    // Prepare
    conf.get.mockReturnValueOnce(null).mockReturnValueOnce(preDefinedSchedules);
    refMock.get.mockResolvedValue(conf);
    FeedHandler.prototype.getFeedTemplate = vi.fn();
    FeedHandler.prototype.handleFeedAndCategory = vi.fn(() =>
      Promise.resolve({ err: "Error processing feed" }),
    );
    FeedHandler.prototype.getFeedTemplate
      .mockReturnValueOnce({ name: "Template 1" })
      .mockReturnValueOnce({ name: "Template 2" });
    FeedHandler.prototype.getFeedTemplates = vi.fn(() =>
      Promise.resolve(templates),
    );
    FeedHandler.prototype.getFeedTargets = vi.fn(() => [
      { feed: "http://example.com/testFeed", category: "testCategory" },
      { feed: "http://example.com/anotherFeed", category: "anotherCategory" },
    ]);

    // Execute
    const result = await new FeedHandler(db).handleFeeds();

    // Verify
    expect(db.collection.mock.calls).toEqual([["service"]]);
    expect(collectionMock.doc.mock.calls).toEqual([["conf"]]);
    expect(refMock.get.mock.calls).toEqual([[]]);
    expect(conf.get.mock.calls).toEqual([["tz"], ["preDefinedSchedules"]]);
    expect(FeedHandler.prototype.getFeedTemplates.mock.calls).toEqual([[]]);
    expect(FeedHandler.prototype.getFeedTargets.mock.calls).toEqual([
      [templates],
    ]);
    expect(FeedHandler.prototype.getFeedTemplate.mock.calls).toEqual([
      [
        templates,
        { feed: "http://example.com/testFeed", category: "testCategory" },
      ],
      [
        templates,
        { feed: "http://example.com/anotherFeed", category: "anotherCategory" },
      ],
    ]);
    expect(FeedHandler.prototype.handleFeedAndCategory.mock.calls).toEqual([
      [
        { name: "Template 1" },
        DEFAULT_TZ,
        preDefinedSchedules,
        { feed: "http://example.com/testFeed", category: "testCategory" },
      ],
      [
        { name: "Template 2" },
        DEFAULT_TZ,
        preDefinedSchedules,
        { feed: "http://example.com/anotherFeed", category: "anotherCategory" },
      ],
    ]);
    expect(result).toEqual({
      err: JSON.stringify(["Error processing feed", "Error processing feed"]),
    });
  });
});
