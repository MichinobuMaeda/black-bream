import { describe, it, expect, afterEach, vi } from "vitest";
import { Mastodon } from "./mastodon.js";
import { Misskey } from "./misskey.js";
import { Bluesky } from "./bluesky.js";
import { Threads } from "./threads.js";
import { Instagram } from "./instagram.js";
import { Twitter } from "./twitter.js";
import { Tumblr } from "./tumblr.js";
import { getDoc, updateDoc } from "./utils.js";
import { Post } from "./post.js";
import { jsonToLex, mock } from "@atproto/api";
import { error } from "firebase-functions/logger";
import { Timestamp, FieldValue } from "firebase-admin/firestore";
import { nanoid } from "nanoid";

vi.mock("firebase-functions/logger");
vi.mock("nanoid");
vi.mock("./utils.js");

vi.mock("./mastodon.js");
Mastodon.prototype.id = "mastodon";
Mastodon.prototype.post = vi.fn(() => Promise.resolve({}));
Mastodon.prototype.refreshAccessToken = vi.fn(() => Promise.resolve({}));
vi.mock("./misskey.js");
Misskey.prototype.id = "misskey";
Misskey.prototype.post = vi.fn(() => Promise.resolve({}));
Misskey.prototype.refreshAccessToken = vi.fn(() => Promise.resolve({}));
vi.mock("./bluesky.js");
Bluesky.prototype.id = "bluesky";
Bluesky.prototype.post = vi.fn(() => Promise.resolve({}));
Bluesky.prototype.refreshAccessToken = vi.fn(() => Promise.resolve({}));
vi.mock("./threads.js");
Threads.prototype.id = "threads";
Threads.prototype.post = vi.fn(() => Promise.resolve({}));
Threads.prototype.refreshAccessToken = vi.fn(() => Promise.resolve({}));
vi.mock("./instagram.js");
Instagram.prototype.id = "instagram";
Instagram.prototype.post = vi.fn(() => Promise.resolve({}));
Instagram.prototype.refreshAccessToken = vi.fn(() => Promise.resolve({}));
vi.mock("./twitter.js");
Twitter.prototype.id = "twitter";
Twitter.prototype.post = vi.fn(() => Promise.resolve({}));
Twitter.prototype.refreshAccessToken = vi.fn(() => Promise.resolve({}));
vi.mock("./tumblr.js");
Tumblr.prototype.id = "tumblr";
Tumblr.prototype.post = vi.fn(() => Promise.resolve({}));
Tumblr.prototype.refreshAccessToken = vi.fn(() => Promise.resolve({}));

const id = "postsId";
const ref = { id, get: vi.fn() };
const doc = vi.fn((id) => ref);
const collection = vi.fn(() => ({ doc }));
const db = { collection };
const bucket = {};
const text = "Text";
const files = ["1.jpg"];
const snap = { id, ref, data: () => ({ text, files, targets }) };
/** @type import("firebase-admin/functions").TaskQueue */
const queue = { enqueue: vi.fn(), delete: vi.fn() };

afterEach(() => {
  vi.clearAllMocks();
});

describe("constructor", () => {
  it("should set id, ref and data of given doc", () => {
    // Prepare
    const snap = { id, ref, data: () => ({ text, files }) };

    // Execute
    const post = new Post(db, bucket, snap);

    // Verify
    expect(post.db).toEqual(db);
    expect(post.bucket).toEqual(bucket);
    expect(post.ref).toEqual(ref);
    expect(post.data).toEqual({ id, text, files });
    expect(collection).not.toHaveBeenCalled();
    expect(doc).not.toHaveBeenCalled();
  });

  it("should set id ant target", () => {
    // Prepare
    const target = "mastodon";

    // Execute
    const post = new Post(db, bucket, { id, target });

    // Verify
    expect(post.db).toEqual(db);
    expect(post.bucket).toEqual(bucket);
    expect(post.ref).toEqual(ref);
    expect(post.data).toEqual({ id, target });
    expect(collection.mock.calls).toEqual([["posts"]]);
    expect(doc.mock.calls).toEqual([[id]]);
  });
});

describe("generateScheduleTime", () => {
  it(
    "should return system time + delay time" +
      " without scheduledFor and scheduleTime of targets.",
    () => {
      // Prepare
      const delay = 9 * 1000;
      const expectedTime = new Date(new Date().getTime() + delay);
      const postData = { text, files };
      const snap = { id, ref, data: () => postData };
      const post = new Post(db, bucket, snap);

      // Execute
      const ret = post.generateScheduleTime();

      // Verify
      expect(ret.toMillis()).toBeGreaterThanOrEqual(expectedTime.getTime());
      expect(ret.toMillis()).toBeLessThan(expectedTime.getTime() + delay);
    },
  );

  it(
    "should returns system time + delay time" +
      " with scheduledFor and scheduleTime of targets before system time.",
    () => {
      // Prepare
      const delay = 9 * 1000;
      const expectedTime = new Date(new Date().getTime() + delay);
      const scheduledFor = Timestamp.fromDate(
        new Date(new Date().getTime() - 1000),
      );
      const targets = {
        mastodon: {
          scheduleTime: Timestamp.fromDate(
            new Date(new Date().getTime() - 1000),
          ),
        },
        misskey: {
          scheduleTime: Timestamp.fromDate(
            new Date(new Date().getTime() - 1000),
          ),
        },
      };
      const postData = { text, files, targets, scheduledFor };
      const snap = { id, ref, data: () => postData };
      const post = new Post(db, bucket, snap);

      // Execute
      const ret = post.generateScheduleTime();

      // Verify
      expect(ret.toMillis()).toBeGreaterThanOrEqual(expectedTime.getTime());
      expect(ret.toMillis()).toBeLessThan(expectedTime.getTime() + delay);
    },
  );

  it(
    "should returns scheduledFor + delay time" +
      " with scheduledFor after system time.",
    () => {
      // Prepare
      const delay = 9 * 1000;
      const scheduledFor = Timestamp.fromMillis(new Date().getTime() + 1000);
      const targets = {};
      const postData = { text, files, targets, scheduledFor };
      const snap = { id, ref, data: () => postData };
      const post = new Post(db, bucket, snap);

      // Execute
      const ret = post.generateScheduleTime();

      // Verify
      expect(ret.toMillis()).toEqual(scheduledFor.toMillis() + delay);
    },
  );
});

describe("createPosts", () => {
  it("should create posts.", async () => {
    // Prepare
    const delay = 9 * 1000;
    const mastodon = {};
    const misskey = {};
    const targets = { mastodon, misskey };
    const scheduledFor = Timestamp.fromMillis(new Date().getTime() + 60 * 1000);
    const postData = { text, files, targets, scheduledFor };
    const snap = { id, ref, data: () => postData };
    const post = new Post(db, bucket, snap);
    const err = new Error("test error");
    queue.enqueue.mockResolvedValueOnce().mockRejectedValueOnce(err);
    updateDoc.mockResolvedValueOnce({});
    nanoid
      .mockImplementationOnce(() => "mastodon-id")
      .mockImplementationOnce(() => "misskey-id");

    // Execute
    const ret = await post.createPosts(queue);

    // Verify
    expect(queue.enqueue.mock.calls).toEqual([
      [
        { id, target: "mastodon" },
        {
          id: "mastodon-id",
          scheduleTime: expect.any(Timestamp),
        },
      ],
      [
        { id, target: "misskey" },
        {
          id: "misskey-id",
          scheduleTime: expect.any(Timestamp),
        },
      ],
    ]);
    expect(targets).toEqual({
      mastodon: {
        queueId: "mastodon-id",
        status: "enqueued",
        enqueuedAt: FieldValue.serverTimestamp,
        updatedAt: FieldValue.serverTimestamp,
        deletedAt: null,
        scheduleTime: expect.any(Timestamp),
      },
      misskey: {
        queueId: "misskey-id",
        status: "failed",
        err: err.message,
        enqueuedAt: null,
        updatedAt: FieldValue.serverTimestamp,
        deletedAt: null,
        scheduleTime: expect.any(Timestamp),
      },
    });
    expect(scheduledFor.toMillis()).toBeGreaterThan(new Date().getTime());
    expect(targets.mastodon.scheduleTime.toMillis()).toBeGreaterThan(
      scheduledFor.toMillis(),
    );
    expect(targets.misskey.scheduleTime.toMillis()).toBeGreaterThan(
      targets.mastodon.scheduleTime.toMillis(),
    );
    expect(updateDoc.mock.calls).toEqual([
      [
        ref,
        {
          status: "enqueued",
          targets,
          updatedAt: FieldValue.serverTimestamp,
          deletedAt: null,
        },
      ],
    ]);
    expect(ret).toEqual({ data: "enqueued" });
  });

  it("should return error if updateDoc returns error.", async () => {
    // Prepare
    const delay = 9 * 1000;
    const mastodon = {};
    const misskey = {};
    const targets = { mastodon, misskey };
    const scheduledFor = Timestamp.fromMillis(new Date().getTime() - 60 * 1000);
    const postData = { text, files, targets, scheduledFor };
    const snap = { id, ref, data: () => postData };
    const post = new Post(db, bucket, snap);
    const err1 = new Error("test error 1");
    const err2 = new Error("test error 2");
    queue.enqueue.mockResolvedValueOnce().mockRejectedValueOnce(err1);
    updateDoc.mockResolvedValueOnce({ err: err2 });
    nanoid
      .mockImplementationOnce(() => "mastodon-id")
      .mockImplementationOnce(() => "misskey-id");

    // Execute
    const ret = await post.createPosts(queue);

    // Verify
    expect(queue.enqueue.mock.calls).toEqual([
      [
        { id, target: "mastodon" },
        {
          id: "mastodon-id",
          scheduleTime: expect.any(Timestamp),
        },
      ],
      [
        { id, target: "misskey" },
        {
          id: "misskey-id",
          scheduleTime: expect.any(Timestamp),
        },
      ],
    ]);
    expect(targets).toEqual({
      mastodon: {
        queueId: "mastodon-id",
        status: "enqueued",
        enqueuedAt: FieldValue.serverTimestamp,
        updatedAt: FieldValue.serverTimestamp,
        deletedAt: null,
        scheduleTime: expect.any(Timestamp),
      },
      misskey: {
        queueId: "misskey-id",
        status: "failed",
        err: err1.message,
        enqueuedAt: null,
        updatedAt: FieldValue.serverTimestamp,
        deletedAt: null,
        scheduleTime: expect.any(Timestamp),
      },
    });
    expect(scheduledFor.toMillis()).toBeLessThan(new Date().getTime());
    expect(targets.mastodon.scheduleTime.toMillis()).toBeGreaterThan(
      scheduledFor.toMillis(),
    );
    expect(targets.misskey.scheduleTime.toMillis()).toBeGreaterThan(
      targets.mastodon.scheduleTime.toMillis(),
    );
    expect(updateDoc.mock.calls).toEqual([
      [
        ref,
        {
          status: "enqueued",
          targets,
          updatedAt: FieldValue.serverTimestamp,
          deletedAt: null,
        },
      ],
    ]);
    expect(ret).toEqual({ err: err2 });
  });
});

describe("deletePosts", () => {
  it("should delete posts.", async () => {
    // Prepare
    const mastodon = {
      queueId: "mastodon-id",
      status: "enqueued",
      scheduleTime: Timestamp.fromDate(new Date("2025-01-01T00:00:00.000Z")),
    };
    const misskey = {
      queueId: "misskey-id",
      status: "enqueued",
      scheduleTime: Timestamp.fromDate(new Date("2025-01-01T00:11:11.111Z")),
    };
    const targets = { mastodon, misskey };
    const snap = { id, ref, data: () => ({ text, files, targets }) };
    const post = new Post(db, bucket, snap);
    const err = new Error("test error");
    queue.delete.mockResolvedValueOnce().mockRejectedValueOnce(err);
    updateDoc.mockResolvedValueOnce({});

    // Execute
    const ret = await post.deletePosts(queue);

    // Verify
    expect(queue.delete.mock.calls).toEqual([["mastodon-id"], ["misskey-id"]]);
    expect(targets).toEqual({
      mastodon: {
        queueId: "mastodon-id",
        status: "deleted",
        deletedAt: FieldValue.serverTimestamp,
        updatedAt: FieldValue.serverTimestamp,
        scheduleTime: mastodon.scheduleTime,
      },
      misskey: {
        queueId: "misskey-id",
        status: "enqueued",
        err: err.message,
        updatedAt: FieldValue.serverTimestamp,
        scheduleTime: misskey.scheduleTime,
      },
    });
    expect(ret).toEqual({ data: "deleted" });
  });

  it("should return error if updateDoc returns error.", async () => {
    // Prepare
    const mastodon = {
      queueId: "mastodon-id",
      status: "enqueued",
      scheduleTime: Timestamp.fromDate(new Date("2025-01-01T00:00:00.000Z")),
    };
    const misskey = {
      queueId: "misskey-id",
      status: "enqueued",
      scheduleTime: Timestamp.fromDate(new Date("2025-01-01T00:11:11.111Z")),
    };
    const targets = { mastodon, misskey };
    const snap = { id, ref, data: () => ({ text, files, targets }) };
    const post = new Post(db, bucket, snap);
    const err1 = new Error("test error 1");
    const err2 = new Error("test error 2");
    queue.delete.mockResolvedValueOnce().mockRejectedValueOnce(err1);
    updateDoc.mockResolvedValueOnce({ err: err2 });

    // Execute
    const ret = await post.deletePosts(queue);

    // Verify
    expect(queue.delete.mock.calls).toEqual([["mastodon-id"], ["misskey-id"]]);
    expect(targets).toEqual({
      mastodon: {
        queueId: "mastodon-id",
        status: "deleted",
        deletedAt: FieldValue.serverTimestamp,
        updatedAt: FieldValue.serverTimestamp,
        scheduleTime: mastodon.scheduleTime,
      },
      misskey: {
        queueId: "misskey-id",
        status: "enqueued",
        err: err1.message,
        updatedAt: FieldValue.serverTimestamp,
        scheduleTime: misskey.scheduleTime,
      },
    });
    expect(ret).toEqual({ err: err2 });
  });
});

describe("setPostStatusError", () => {
  it("should set post status to error.", async () => {
    // Prepare
    const target = "mastodon";
    const post = new Post(db, bucket, { id, target });
    updateDoc.mockResolvedValueOnce({});
    const err = new Error("test error");

    // Execute
    const ret = await post.setPostStatusError(err);

    // Verify
    expect(updateDoc.mock.calls).toEqual([
      [
        ref,
        {
          status: "posting",
          ["targets.mastodon"]: {
            status: "failed",
            err: err.message,
            updatedAt: FieldValue.serverTimestamp,
          },
          updatedAt: FieldValue.serverTimestamp,
        },
      ],
    ]);
    expect(ret).toEqual({ err });
  });

  it("should return error if updateDoc returns error.", async () => {
    // Prepare
    const target = "misskey";
    const post = new Post(db, bucket, { id, target });
    const err = new Error("test error");
    updateDoc.mockResolvedValueOnce({ err });

    // Execute
    const ret = await post.setPostStatusError(new Error("error"));

    // Verify
    expect(updateDoc.mock.calls).toEqual([
      [
        ref,
        {
          status: "posting",
          ["targets.misskey"]: {
            status: "failed",
            err: "error",
            updatedAt: FieldValue.serverTimestamp,
          },
          updatedAt: FieldValue.serverTimestamp,
        },
      ],
    ]);
    expect(ret).toEqual({ err });
  });
});

describe("getPostData", () => {
  it("should return error if getDoc returns error.", async () => {
    // Prepare
    const target = "mastodon";
    const post = new Post(db, bucket, { id, target });
    const err = new Error("test error");
    getDoc.mockResolvedValueOnce({ err });

    // Execute
    const ret = await post.getPostData();

    // Verify
    expect(getDoc.mock.calls).toEqual([[ref]]);
    expect(ret).toEqual({ err });
  });

  it("should return error if doc is not exists.", async () => {
    // Prepare
    const target = "mastodon";
    const post = new Post(db, bucket, { id, target });
    const snap = { id, exists: false };
    getDoc.mockResolvedValueOnce({ data: snap });

    // Execute
    const ret = await post.getPostData();

    // Verify
    expect(getDoc.mock.calls).toEqual([[ref]]);
    expect(ret).toEqual({ err: new Error(`Not found: posts/${id}`) });
  });

  it("should return error if doc has been deleted.", async () => {
    // Prepare
    const target = "mastodon";
    const post = new Post(db, bucket, { id, target });
    const snap = {
      id,
      exists: true,
      get: vi.fn(() => new Date()), // deletedAt
    };
    getDoc.mockResolvedValueOnce({ data: snap });

    // Execute
    const ret = await post.getPostData();

    // Verify
    expect(getDoc.mock.calls).toEqual([[ref]]);
    expect(snap.get.mock.calls).toEqual([["deletedAt"]]);
    expect(ret).toEqual({ err: new Error(`Already deleted: posts/${id}`) });
  });

  it("should return post data.", async () => {
    // Prepare
    const target = "mastodon";
    const targets = { mastodon: {}, misskey: {} };
    const post = new Post(db, bucket, { id, target });
    const snap = {
      id,
      exists: true,
      get: vi.fn(() => null), // deletedAt
      data: () => ({ text, files, targets }),
    };
    getDoc.mockResolvedValueOnce({ data: snap });

    // Execute
    const ret = await post.getPostData();

    // Verify
    expect(getDoc.mock.calls).toEqual([[ref]]);
    expect(snap.get.mock.calls).toEqual([["deletedAt"]]);
    expect(ret).toEqual({ data: { text, files, targets } });
  });
});

describe("verifyTargetStatus", () => {
  it("should return error if target is not found.", async () => {
    // Prepare
    const target = "mastodon";
    const post = new Post(db, bucket, { id, target });
    const targets = {};
    const ret = post.verifyTargetStatus(targets);

    // Verify
    expect(ret).toEqual({
      err: new Error(`Not found: mastodon in posts/${id}`),
    });
  });

  it("should return error if target has been deleted.", async () => {
    // Prepare
    const target = "mastodon";
    const post = new Post(db, bucket, { id, target });
    const targets = { mastodon: { deletedAt: new Date() } };
    const ret = post.verifyTargetStatus(targets);

    // Verify
    expect(ret).toEqual({
      err: new Error(`Invalid status: mastodon is deleted`),
    });
  });

  it("should return error if target status is invalid.", async () => {
    // Prepare
    const target = "mastodon";
    const post = new Post(db, bucket, { id, target });
    const targets = { mastodon: { status: "posted" } };
    const ret = post.verifyTargetStatus(targets);

    // Verify
    expect(ret).toEqual({
      err: new Error(`Invalid status: mastodon.status: posted`),
    });
  });

  it("should return undefined if target status is valid.", async () => {
    // Prepare
    const target = "mastodon";
    const post = new Post(db, bucket, { id, target });
    const targets = { mastodon: { status: "enqueued" } };
    const ret = post.verifyTargetStatus(targets);

    // Verify
    expect(ret).toEqual({});
  });
});

describe("post", () => {
  const target = "mastodon";
  const mastodon = {
    status: "enqueued",
    scheduleTime: new Date("2025-01-01T00:00:00.000Z"),
  };
  const misskey = {
    status: "enqueued",
    scheduleTime: new Date("2025-01-01T00:11:11.111Z"),
  };
  const targets = { mastodon, misskey };
  const updateData01 = [
    ref,
    {
      status: "posting",
      ["targets.mastodon"]: {
        status: "posting",
        updatedAt: FieldValue.serverTimestamp,
      },
      updatedAt: FieldValue.serverTimestamp,
    },
  ];
  const updateData02 = [
    ref,
    {
      status: "posting",
      ["targets.mastodon"]: {
        status: "completed",
        updatedAt: FieldValue.serverTimestamp,
      },
      updatedAt: FieldValue.serverTimestamp,
    },
  ];

  it("should post to mastodon.", async () => {
    // Prepare
    const postData = { text, files, targets };
    const post = new Post(db, bucket, { id, target });
    const mockGetPostData = vi.spyOn(post, "getPostData");
    mockGetPostData.mockResolvedValueOnce({ data: postData });
    const mockVerifyTargetStatus = vi.spyOn(post, "verifyTargetStatus");
    mockVerifyTargetStatus.mockImplementationOnce(() => ({}));
    const provider = new Mastodon(db, bucket);
    Mastodon.prototype.refreshAccessToken.mockResolvedValueOnce({});
    Mastodon.prototype.post.mockResolvedValueOnce({});
    updateDoc.mockResolvedValueOnce({}).mockResolvedValueOnce({});

    // Execute
    const ret = await post.post();

    // Verify
    expect(mockGetPostData.mock.calls).toEqual([[]]);
    expect(mockVerifyTargetStatus.mock.calls).toEqual([[targets]]);
    expect(Mastodon.prototype.refreshAccessToken.mock.calls).toEqual([[]]);
    expect(Mastodon.prototype.post.mock.calls).toEqual([[id, { text, files }]]);
    expect(updateDoc.mock.calls).toEqual([updateData01, updateData02]);
    expect(ret).toEqual({ data: "posting" });
  });

  it("should return error if getPostData returns error.", async () => {
    // Prepare
    const post = new Post(db, bucket, { id, target });
    const mockGetPostData = vi.spyOn(post, "getPostData");
    const err = new Error("test error");
    mockGetPostData.mockResolvedValueOnce({ err });

    // Execute
    const ret = await post.post();

    // Verify
    expect(mockGetPostData.mock.calls).toEqual([[]]);
    expect(updateDoc).not.toHaveBeenCalled();
    expect(ret).toEqual({ err });
  });

  it("should return error if verifyTargetStatus returns error.", async () => {
    // Prepare
    const post = new Post(db, bucket, { id, target });
    const mockGetPostData = vi.spyOn(post, "getPostData");
    mockGetPostData.mockResolvedValueOnce({ data: { text, files, targets } });
    const mockVerifyTargetStatus = vi.spyOn(post, "verifyTargetStatus");
    const err = new Error("test error");
    mockVerifyTargetStatus.mockImplementationOnce(() => ({ err }));
    const mockSetPostStatusError = vi.spyOn(post, "setPostStatusError");
    mockSetPostStatusError.mockResolvedValueOnce({ err });

    // Execute
    const ret = await post.post();

    // Verify
    expect(mockGetPostData.mock.calls).toEqual([[]]);
    expect(mockVerifyTargetStatus.mock.calls).toEqual([[targets]]);
    expect(mockSetPostStatusError.mock.calls).toEqual([[err]]);
    expect(updateDoc).not.toHaveBeenCalled();
    expect(ret).toEqual({ err });
  });

  it("should return error if fail to get provider params.", async () => {
    // Prepare
    const target = "dummy";
    const post = new Post(db, bucket, { id, target });
    const mockGetPostData = vi.spyOn(post, "getPostData");
    mockGetPostData.mockResolvedValueOnce({ data: { text, files, targets } });
    const mockVerifyTargetStatus = vi.spyOn(post, "verifyTargetStatus");
    mockVerifyTargetStatus.mockImplementationOnce(() => ({}));
    const mockSetPostStatusError = vi.spyOn(post, "setPostStatusError");
    const err = new Error("test error");
    mockSetPostStatusError.mockResolvedValueOnce({ err });

    // Execute
    const ret = await post.post();

    // Verify
    expect(mockGetPostData.mock.calls).toEqual([[]]);
    expect(mockVerifyTargetStatus.mock.calls).toEqual([[targets]]);
    expect(mockSetPostStatusError.mock.calls).toEqual([
      [new Error("Unsupported target: dummy")],
    ]);
    expect(updateDoc).not.toHaveBeenCalled();
    expect(ret).toEqual({ err });
  });

  it("should return error if updateDoc returns error. #1", async () => {
    // Prepare
    const post = new Post(db, bucket, { id, target });
    const mockGetPostData = vi.spyOn(post, "getPostData");
    mockGetPostData.mockResolvedValueOnce({ data: { text, files, targets } });
    const mockVerifyTargetStatus = vi.spyOn(post, "verifyTargetStatus");
    mockVerifyTargetStatus.mockImplementationOnce(() => ({}));
    const provider = new Mastodon(db, bucket);
    const err = new Error("test error");
    updateDoc.mockResolvedValueOnce({ err });
    const mockSetPostStatusError = vi.spyOn(post, "setPostStatusError");
    mockSetPostStatusError.mockResolvedValueOnce({ err });

    // Execute
    const ret = await post.post();

    // Verify
    expect(mockGetPostData.mock.calls).toEqual([[]]);
    expect(mockVerifyTargetStatus.mock.calls).toEqual([[targets]]);
    expect(Mastodon.prototype.refreshAccessToken).not.toHaveBeenCalled();
    expect(Mastodon.prototype.post).not.toHaveBeenCalled();
    expect(updateDoc.mock.calls).toEqual([updateData01]);
    expect(mockSetPostStatusError.mock.calls).toEqual([[err]]);
    expect(ret).toEqual({ err });
  });

  it("should return error if updateDoc returns error. #2", async () => {
    // Prepare
    const post = new Post(db, bucket, { id, target });
    const mockGetPostData = vi.spyOn(post, "getPostData");
    mockGetPostData.mockResolvedValueOnce({ data: { text, files, targets } });
    const mockVerifyTargetStatus = vi.spyOn(post, "verifyTargetStatus");
    mockVerifyTargetStatus.mockImplementationOnce(() => ({}));
    const provider = new Mastodon(db, bucket);
    Mastodon.prototype.refreshAccessToken.mockResolvedValueOnce({});
    Mastodon.prototype.post.mockResolvedValueOnce({});
    const err = new Error("test error");
    updateDoc.mockResolvedValueOnce({}).mockResolvedValueOnce({ err });
    const mockSetPostStatusError = vi.spyOn(post, "setPostStatusError");
    mockSetPostStatusError.mockResolvedValueOnce({ err });

    // Execute
    const ret = await post.post();

    // Verify
    expect(mockGetPostData.mock.calls).toEqual([[]]);
    expect(mockVerifyTargetStatus.mock.calls).toEqual([[targets]]);
    expect(Mastodon.prototype.refreshAccessToken.mock.calls).toEqual([[]]);
    expect(Mastodon.prototype.post.mock.calls).toEqual([[id, { text, files }]]);
    expect(updateDoc.mock.calls).toEqual([updateData01, updateData02]);
    expect(mockSetPostStatusError.mock.calls).toEqual([[err]]);
    expect(ret).toEqual({ err });
  });

  it("should return error if refreshAccessToken returns error.", async () => {
    // Prepare
    const post = new Post(db, bucket, { id, target });
    const mockGetPostData = vi.spyOn(post, "getPostData");
    mockGetPostData.mockResolvedValueOnce({ data: { text, files, targets } });
    const mockVerifyTargetStatus = vi.spyOn(post, "verifyTargetStatus");
    mockVerifyTargetStatus.mockImplementationOnce(() => ({}));
    const provider = new Mastodon(db, bucket);
    updateDoc.mockResolvedValueOnce({});
    const err = new Error("test error");
    Mastodon.prototype.refreshAccessToken.mockResolvedValueOnce({ err });
    const mockSetPostStatusError = vi.spyOn(post, "setPostStatusError");
    mockSetPostStatusError.mockResolvedValueOnce({ err });

    // Execute
    const ret = await post.post();

    // Verify
    expect(mockGetPostData.mock.calls).toEqual([[]]);
    expect(mockVerifyTargetStatus.mock.calls).toEqual([[targets]]);
    expect(Mastodon.prototype.refreshAccessToken.mock.calls).toEqual([[]]);
    expect(Mastodon.prototype.post).not.toHaveBeenCalled();
    expect(updateDoc.mock.calls).toEqual([updateData01]);
    expect(mockSetPostStatusError.mock.calls).toEqual([[err]]);
    expect(ret).toEqual({ err });
  });

  it("should return error if post returns error.", async () => {
    // Prepare
    const post = new Post(db, bucket, { id, target });
    const mockGetPostData = vi.spyOn(post, "getPostData");
    mockGetPostData.mockResolvedValueOnce({ data: { text, files, targets } });
    const mockVerifyTargetStatus = vi.spyOn(post, "verifyTargetStatus");
    mockVerifyTargetStatus.mockImplementationOnce(() => ({}));
    const provider = new Mastodon(db, bucket);
    updateDoc.mockResolvedValueOnce({});
    Mastodon.prototype.refreshAccessToken.mockResolvedValueOnce({});
    const err = new Error("test error");
    Mastodon.prototype.post.mockResolvedValueOnce({ err });
    const mockSetPostStatusError = vi.spyOn(post, "setPostStatusError");
    mockSetPostStatusError.mockResolvedValueOnce({ err });

    // Execute
    const ret = await post.post();

    // Verify
    expect(mockGetPostData.mock.calls).toEqual([[]]);
    expect(mockVerifyTargetStatus.mock.calls).toEqual([[targets]]);
    expect(Mastodon.prototype.refreshAccessToken.mock.calls).toEqual([[]]);
    expect(Mastodon.prototype.post.mock.calls).toEqual([[id, { text, files }]]);
    expect(updateDoc.mock.calls).toEqual([updateData01]);
    expect(mockSetPostStatusError.mock.calls).toEqual([[err]]);
    expect(ret).toEqual({ err });
  });
});

describe("checkCompleted", () => {
  it("should update status to completed if all targets are completed.", async () => {
    // Prepare
    const target = "mastodon";
    const mastodon = { status: "completed" };
    const misskey = { status: "completed" };
    const targets = { mastodon, misskey };
    const postData = { text, files, targets };
    const snap = { id, ref, data: () => postData };
    const post = new Post(db, bucket, snap);
    updateDoc.mockResolvedValueOnce({});

    // Execute
    const ret = await post.checkCompleted();

    // Verify
    expect(updateDoc.mock.calls).toEqual([
      [
        ref,
        {
          status: "completed",
          updatedAt: FieldValue.serverTimestamp,
        },
      ],
    ]);
    expect(ret).toEqual({ data: "completed" });
  });

  it("should update status to failed if a targets are failed.", async () => {
    // Prepare
    const target = "mastodon";
    const mastodon = { status: "completed" };
    const misskey = { status: "failed" };
    const targets = { mastodon, misskey };
    const postData = { text, files, targets };
    const snap = { id, ref, data: () => postData };
    const post = new Post(db, bucket, snap);
    updateDoc.mockResolvedValueOnce({});

    // Execute
    const ret = await post.checkCompleted();

    // Verify
    expect(updateDoc.mock.calls).toEqual([
      [
        ref,
        {
          status: "failed",
          updatedAt: FieldValue.serverTimestamp,
        },
      ],
    ]);
    expect(ret).toEqual({ data: "failed" });
  });

  it("should return error if updateDoc returns error.", async () => {
    // Prepare
    const target = "mastodon";
    const mastodon = { status: "completed" };
    const misskey = { status: "completed" };
    const targets = { mastodon, misskey };
    const postData = { text, files, targets };
    const snap = { id, ref, data: () => postData };
    const post = new Post(db, bucket, snap);
    updateDoc.mockResolvedValueOnce({ err: "error" });

    // Execute
    const ret = await post.checkCompleted();

    // Verify
    expect(updateDoc.mock.calls).toEqual([
      [
        ref,
        {
          status: "completed",
          updatedAt: FieldValue.serverTimestamp,
        },
      ],
    ]);
    expect(ret).toEqual({ err: "error" });
  });

  it("should not update status if all targets are not ended.", async () => {
    // Prepare
    const target = "mastodon";
    const mastodon = { status: "completed" };
    const misskey = { status: "enqueued" };
    const targets = { mastodon, misskey };
    const postData = { text, files, targets };
    const snap = { id, ref, data: () => postData };
    const post = new Post(db, bucket, snap);

    // Execute
    const ret = await post.checkCompleted();

    // Verify
    expect(updateDoc).not.toHaveBeenCalled();
    expect(ret).toEqual({});
  });
});
