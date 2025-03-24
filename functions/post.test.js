const { describe, it, expect, afterEach } = require("@jest/globals");
const { Mastodon } = require("./mastodon.js");
const { Misskey } = require("./misskey.js");
const { Bluesky } = require("./bluesky.js");
const { Threads } = require("./threads.js");
const { Instagram } = require("./instagram.js");
const { Twitter } = require("./twitter.js");
const { Tumblr } = require("./tumblr.js");

const { getDoc, updateDoc } = require("./utils.js");
const { Post } = require("./post.js");
const { jsonToLex, mock } = require("@atproto/api");
const { error } = require("firebase-functions/logger");

jest.mock("firebase-functions/logger");
jest.mock("./utils.js");

jest.mock("./mastodon.js");
Mastodon.prototype.id = "mastodon";
Mastodon.prototype.post = jest.fn(() => Promise.resolve({}));
Mastodon.prototype.refreshAccessToken = jest.fn(() => Promise.resolve({}));
jest.mock("./misskey.js");
Misskey.prototype.id = "misskey";
Misskey.prototype.post = jest.fn(() => Promise.resolve({}));
Misskey.prototype.refreshAccessToken = jest.fn(() => Promise.resolve({}));
jest.mock("./bluesky.js");
Bluesky.prototype.id = "bluesky";
Bluesky.prototype.post = jest.fn(() => Promise.resolve({}));
Bluesky.prototype.refreshAccessToken = jest.fn(() => Promise.resolve({}));
jest.mock("./threads.js");
Threads.prototype.id = "threads";
Threads.prototype.post = jest.fn(() => Promise.resolve({}));
Threads.prototype.refreshAccessToken = jest.fn(() => Promise.resolve({}));
jest.mock("./instagram.js");
Instagram.prototype.id = "instagram";
Instagram.prototype.post = jest.fn(() => Promise.resolve({}));
Instagram.prototype.refreshAccessToken = jest.fn(() => Promise.resolve({}));
jest.mock("./twitter.js");
Twitter.prototype.id = "twitter";
Twitter.prototype.post = jest.fn(() => Promise.resolve({}));
Twitter.prototype.refreshAccessToken = jest.fn(() => Promise.resolve({}));
jest.mock("./tumblr.js");
Tumblr.prototype.id = "tumblr";
Tumblr.prototype.post = jest.fn(() => Promise.resolve({}));
Tumblr.prototype.refreshAccessToken = jest.fn(() => Promise.resolve({}));

const id = "postsId";
const ref = { id, get: jest.fn() };
const doc = jest.fn((id) => ref);
const collection = jest.fn(() => ({ doc }));
const db = { collection };
const bucket = {};
const text = "Text";
const files = ["1.jpg"];
const snap = { id, ref, data: () => ({ text, files, targets }) };
/** @type import("firebase-admin/functions").TaskQueue */
const queue = { enqueue: jest.fn(), delete: jest.fn() };

afterEach(() => {
  jest.clearAllMocks();
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

describe("createPosts", () => {
  it("should create posts.", async () => {
    // Prepare
    const delay = 9 * 1000;
    const mastodon = {};
    const misskey = {};
    const targets = { mastodon, misskey };
    const scheduledFor = {
      toDate: () => new Date(new Date().getTime() + 60 * 1000),
    };
    const postData = { text, files, targets, scheduledFor };
    const snap = { id, ref, data: () => postData };
    const post = new Post(db, bucket, snap);
    queue.enqueue.mockResolvedValueOnce().mockRejectedValueOnce("error");
    updateDoc.mockResolvedValueOnce({});

    // Execute
    const ret = await post.createPosts(queue);

    // Verify
    expect(queue.enqueue.mock.calls).toEqual([
      [
        { id, target: "mastodon" },
        {
          id: `${id}-mastodon`,
          scheduleTime: expect.any(Date),
        },
      ],
      [
        { id, target: "misskey" },
        {
          id: `${id}-misskey`,
          scheduleTime: expect.any(Date),
        },
      ],
    ]);
    expect(targets).toEqual({
      mastodon: {
        status: "enqueued",
        enqueuedAt: expect.any(Date),
        updatedAt: expect.any(Date),
        deletedAt: null,
        scheduleTime: expect.any(Date),
      },
      misskey: {
        status: "failed",
        err: "error",
        enqueuedAt: null,
        updatedAt: expect.any(Date),
        deletedAt: null,
        scheduleTime: expect.any(Date),
      },
    });
    expect(scheduledFor.toDate().getTime()).toBeGreaterThan(
      new Date().getTime(),
    );
    expect(targets.mastodon.scheduleTime.getTime()).toBeGreaterThan(
      scheduledFor.toDate().getTime(),
    );
    expect(targets.misskey.scheduleTime.getTime()).toBeGreaterThan(
      targets.mastodon.scheduleTime.getTime(),
    );
    expect(updateDoc.mock.calls).toEqual([
      [
        ref,
        {
          status: "enqueued",
          targets,
          updatedAt: expect.any(Date),
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
    const scheduledFor = {
      toDate: () => new Date(new Date().getTime() - 60 * 1000),
    };
    const postData = { text, files, targets, scheduledFor };
    const snap = { id, ref, data: () => postData };
    const post = new Post(db, bucket, snap);
    queue.enqueue.mockResolvedValueOnce().mockRejectedValueOnce("error");
    updateDoc.mockResolvedValueOnce({ err: "error" });

    // Execute
    const ret = await post.createPosts(queue);

    // Verify
    expect(queue.enqueue.mock.calls).toEqual([
      [
        { id, target: "mastodon" },
        {
          id: `${id}-mastodon`,
          scheduleTime: expect.any(Date),
        },
      ],
      [
        { id, target: "misskey" },
        {
          id: `${id}-misskey`,
          scheduleTime: expect.any(Date),
        },
      ],
    ]);
    expect(targets).toEqual({
      mastodon: {
        status: "enqueued",
        enqueuedAt: expect.any(Date),
        updatedAt: expect.any(Date),
        deletedAt: null,
        scheduleTime: expect.any(Date),
      },
      misskey: {
        status: "failed",
        err: "error",
        enqueuedAt: null,
        updatedAt: expect.any(Date),
        deletedAt: null,
        scheduleTime: expect.any(Date),
      },
    });
    expect(scheduledFor.toDate().getTime()).toBeLessThan(new Date().getTime());
    expect(targets.mastodon.scheduleTime.getTime()).toBeGreaterThan(
      scheduledFor.toDate().getTime(),
    );
    expect(targets.misskey.scheduleTime.getTime()).toBeGreaterThan(
      targets.mastodon.scheduleTime.getTime(),
    );
    expect(updateDoc.mock.calls).toEqual([
      [
        ref,
        {
          status: "enqueued",
          targets,
          updatedAt: expect.any(Date),
          deletedAt: null,
        },
      ],
    ]);
    expect(ret).toEqual({ err: "error" });
  });
});

describe("deletePosts", () => {
  it("should delete posts.", async () => {
    // Prepare
    const mastodon = {
      status: "enqueued",
      scheduleTime: new Date("2025-01-01T00:00:00.000Z"),
    };
    const misskey = {
      status: "enqueued",
      scheduleTime: new Date("2025-01-01T00:11:11.111Z"),
    };
    const targets = { mastodon, misskey };
    const snap = { id, ref, data: () => ({ text, files, targets }) };
    const post = new Post(db, bucket, snap);
    queue.delete.mockResolvedValueOnce().mockRejectedValueOnce("error");
    updateDoc.mockResolvedValueOnce({});

    // Execute
    const ret = await post.deletePosts(queue);

    // Verify
    expect(queue.delete.mock.calls).toEqual([
      [`${id}-mastodon`],
      [`${id}-misskey`],
    ]);
    expect(targets).toEqual({
      mastodon: {
        status: "deleted",
        deletedAt: expect.any(Date),
        updatedAt: expect.any(Date),
        scheduleTime: mastodon.scheduleTime,
      },
      misskey: {
        status: "enqueued",
        err: "error",
        updatedAt: expect.any(Date),
        scheduleTime: misskey.scheduleTime,
      },
    });
    expect(ret).toEqual({ data: "deleted" });
  });

  it("should return error if updateDoc returns error.", async () => {
    // Prepare
    const mastodon = {
      status: "enqueued",
      scheduleTime: new Date("2025-01-01T00:00:00.000Z"),
    };
    const misskey = {
      status: "enqueued",
      scheduleTime: new Date("2025-01-01T00:11:11.111Z"),
    };
    const targets = { mastodon, misskey };
    const snap = { id, ref, data: () => ({ text, files, targets }) };
    const post = new Post(db, bucket, snap);
    queue.delete.mockResolvedValueOnce().mockRejectedValueOnce("error");
    updateDoc.mockResolvedValueOnce({ err: "error" });

    // Execute
    const ret = await post.deletePosts(queue);

    // Verify
    expect(queue.delete.mock.calls).toEqual([
      [`${id}-mastodon`],
      [`${id}-misskey`],
    ]);
    expect(targets).toEqual({
      mastodon: {
        status: "deleted",
        deletedAt: expect.any(Date),
        updatedAt: expect.any(Date),
        scheduleTime: mastodon.scheduleTime,
      },
      misskey: {
        status: "enqueued",
        err: "error",
        updatedAt: expect.any(Date),
        scheduleTime: misskey.scheduleTime,
      },
    });
    expect(ret).toEqual({ err: "error" });
  });
});

describe("setPostStatusError", () => {
  it("should set post status to error.", async () => {
    // Prepare
    const target = "mastodon";
    const post = new Post(db, bucket, { id, target });
    updateDoc.mockResolvedValueOnce({});

    // Execute
    const ret = await post.setPostStatusError("Error message");

    // Verify
    expect(updateDoc.mock.calls).toEqual([
      [
        ref,
        {
          status: "posting",
          ["targets.mastodon"]: {
            status: "failed",
            err: "Error message",
            updatedAt: expect.any(Date),
          },
          updatedAt: expect.any(Date),
        },
      ],
    ]);
    expect(ret).toEqual({ err: "Error message" });
  });

  it("should return error if updateDoc returns error.", async () => {
    // Prepare
    const target = "misskey";
    const post = new Post(db, bucket, { id, target });
    updateDoc.mockResolvedValueOnce({ err: "error" });

    // Execute
    const ret = await post.setPostStatusError("error");

    // Verify
    expect(updateDoc.mock.calls).toEqual([
      [
        ref,
        {
          status: "posting",
          ["targets.misskey"]: {
            status: "failed",
            err: "error",
            updatedAt: expect.any(Date),
          },
          updatedAt: expect.any(Date),
        },
      ],
    ]);
    expect(ret).toEqual({ err: "error" });
  });
});

describe("getPostData", () => {
  it("should return error if getDoc returns error.", async () => {
    // Prepare
    const target = "mastodon";
    const post = new Post(db, bucket, { id, target });
    getDoc.mockResolvedValueOnce({ err: "error" });

    // Execute
    const ret = await post.getPostData();

    // Verify
    expect(getDoc.mock.calls).toEqual([[ref]]);
    expect(ret).toEqual({ err: `Failed to get posts/${ref.id}: error` });
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
    expect(ret).toEqual({ err: `Not found: posts/${id}` });
  });

  it("should return error if doc has been deleted.", async () => {
    // Prepare
    const target = "mastodon";
    const post = new Post(db, bucket, { id, target });
    const snap = {
      id,
      exists: true,
      get: jest.fn(() => new Date()), // deletedAt
    };
    getDoc.mockResolvedValueOnce({ data: snap });

    // Execute
    const ret = await post.getPostData();

    // Verify
    expect(getDoc.mock.calls).toEqual([[ref]]);
    expect(snap.get.mock.calls).toEqual([["deletedAt"]]);
    expect(ret).toEqual({ err: `Already deleted: posts/${id}` });
  });

  it("should return post data.", async () => {
    // Prepare
    const target = "mastodon";
    const targets = { mastodon: {}, misskey: {} };
    const post = new Post(db, bucket, { id, target });
    const snap = {
      id,
      exists: true,
      get: jest.fn(() => null), // deletedAt
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
    expect(ret).toEqual({ err: `Not found: mastodon in posts/${id}` });
  });

  it("should return error if target has been deleted.", async () => {
    // Prepare
    const target = "mastodon";
    const post = new Post(db, bucket, { id, target });
    const targets = { mastodon: { deletedAt: new Date() } };
    const ret = post.verifyTargetStatus(targets);

    // Verify
    expect(ret).toEqual({ err: `Invalid status: mastodon is deleted` });
  });

  it("should return error if target status is invalid.", async () => {
    // Prepare
    const target = "mastodon";
    const post = new Post(db, bucket, { id, target });
    const targets = { mastodon: { status: "posted" } };
    const ret = post.verifyTargetStatus(targets);

    // Verify
    expect(ret).toEqual({ err: `Invalid status: mastodon.status: posted` });
  });

  it("should return undefined if target status is valid.", async () => {
    // Prepare
    const target = "mastodon";
    const post = new Post(db, bucket, { id, target });
    const targets = { mastodon: { status: "enqueued" } };
    const ret = post.verifyTargetStatus(targets);

    // Verify
    expect(ret).toEqual({ err: undefined });
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
        updatedAt: expect.any(Date),
      },
      updatedAt: expect.any(Date),
    },
  ];
  const updateData02 = [
    ref,
    {
      status: "posting",
      ["targets.mastodon"]: {
        status: "completed",
        updatedAt: expect.any(Date),
      },
      updatedAt: expect.any(Date),
    },
  ];

  it("should post to mastodon.", async () => {
    // Prepare
    const postData = { text, files, targets };
    const post = new Post(db, bucket, { id, target });
    mockGetPostData = jest.spyOn(post, "getPostData");
    mockGetPostData.mockResolvedValueOnce({ data: postData });
    mockVerifyTargetStatus = jest.spyOn(post, "verifyTargetStatus");
    mockVerifyTargetStatus.mockImplementationOnce(() => ({ err: undefined }));
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
    mockGetPostData = jest.spyOn(post, "getPostData");
    mockGetPostData.mockResolvedValueOnce({ err: "error" });

    // Execute
    const ret = await post.post();

    // Verify
    expect(mockGetPostData.mock.calls).toEqual([[]]);
    expect(updateDoc).not.toHaveBeenCalled();
    expect(ret).toEqual({ err: "error" });
  });

  it("should return error if verifyTargetStatus returns error.", async () => {
    // Prepare
    const post = new Post(db, bucket, { id, target });
    mockGetPostData = jest.spyOn(post, "getPostData");
    mockGetPostData.mockResolvedValueOnce({ data: { text, files, targets } });
    mockVerifyTargetStatus = jest.spyOn(post, "verifyTargetStatus");
    mockVerifyTargetStatus.mockImplementationOnce(() => ({ err: "error" }));
    mockSetPostStatusError = jest.spyOn(post, "setPostStatusError");
    mockSetPostStatusError.mockResolvedValueOnce({ err: "error" });

    // Execute
    const ret = await post.post();

    // Verify
    expect(mockGetPostData.mock.calls).toEqual([[]]);
    expect(mockVerifyTargetStatus.mock.calls).toEqual([[targets]]);
    expect(mockSetPostStatusError.mock.calls).toEqual([["error"]]);
    expect(updateDoc).not.toHaveBeenCalled();
    expect(ret).toEqual({ err: "error" });
  });

  it("should return error if fail to get provider params.", async () => {
    // Prepare
    const target = "dummy";
    const post = new Post(db, bucket, { id, target });
    mockGetPostData = jest.spyOn(post, "getPostData");
    mockGetPostData.mockResolvedValueOnce({ data: { text, files, targets } });
    mockVerifyTargetStatus = jest.spyOn(post, "verifyTargetStatus");
    mockVerifyTargetStatus.mockImplementationOnce(() => ({ err: undefined }));
    mockSetPostStatusError = jest.spyOn(post, "setPostStatusError");
    mockSetPostStatusError.mockResolvedValueOnce({ err: "error" });

    // Execute
    const ret = await post.post();

    // Verify
    expect(mockGetPostData.mock.calls).toEqual([[]]);
    expect(mockVerifyTargetStatus.mock.calls).toEqual([[targets]]);
    expect(mockSetPostStatusError.mock.calls).toEqual([
      ["Unsupported target: dummy"],
    ]);
    expect(updateDoc).not.toHaveBeenCalled();
    expect(ret).toEqual({ err: "error" });
  });

  it("should return error if updateDoc returns error. #1", async () => {
    // Prepare
    const post = new Post(db, bucket, { id, target });
    mockGetPostData = jest.spyOn(post, "getPostData");
    mockGetPostData.mockResolvedValueOnce({ data: { text, files, targets } });
    mockVerifyTargetStatus = jest.spyOn(post, "verifyTargetStatus");
    mockVerifyTargetStatus.mockImplementationOnce(() => ({ err: undefined }));
    const provider = new Mastodon(db, bucket);
    updateDoc.mockResolvedValueOnce({ err: "update error" });
    mockSetPostStatusError = jest.spyOn(post, "setPostStatusError");
    mockSetPostStatusError.mockResolvedValueOnce({ err: "error" });

    // Execute
    const ret = await post.post();

    // Verify
    expect(mockGetPostData.mock.calls).toEqual([[]]);
    expect(mockVerifyTargetStatus.mock.calls).toEqual([[targets]]);
    expect(Mastodon.prototype.refreshAccessToken).not.toHaveBeenCalled();
    expect(Mastodon.prototype.post).not.toHaveBeenCalled();
    expect(updateDoc.mock.calls).toEqual([updateData01]);
    expect(mockSetPostStatusError.mock.calls).toEqual([
      ["Failed to set posing status: update error"],
    ]);
    expect(ret).toEqual({ err: "error" });
  });

  it("should return error if updateDoc returns error. #2", async () => {
    // Prepare
    const post = new Post(db, bucket, { id, target });
    mockGetPostData = jest.spyOn(post, "getPostData");
    mockGetPostData.mockResolvedValueOnce({ data: { text, files, targets } });
    mockVerifyTargetStatus = jest.spyOn(post, "verifyTargetStatus");
    mockVerifyTargetStatus.mockImplementationOnce(() => ({ err: undefined }));
    const provider = new Mastodon(db, bucket);
    Mastodon.prototype.refreshAccessToken.mockResolvedValueOnce({});
    Mastodon.prototype.post.mockResolvedValueOnce({});
    updateDoc
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ err: "update error" });
    mockSetPostStatusError = jest.spyOn(post, "setPostStatusError");
    mockSetPostStatusError.mockResolvedValueOnce({ err: "error" });

    // Execute
    const ret = await post.post();

    // Verify
    expect(mockGetPostData.mock.calls).toEqual([[]]);
    expect(mockVerifyTargetStatus.mock.calls).toEqual([[targets]]);
    expect(Mastodon.prototype.refreshAccessToken.mock.calls).toEqual([[]]);
    expect(Mastodon.prototype.post.mock.calls).toEqual([[id, { text, files }]]);
    expect(updateDoc.mock.calls).toEqual([updateData01, updateData02]);
    expect(mockSetPostStatusError.mock.calls).toEqual([
      ["Failed to set completed status: update error"],
    ]);
    expect(ret).toEqual({ err: "error" });
  });

  it("should return error if refreshAccessToken returns error.", async () => {
    // Prepare
    const post = new Post(db, bucket, { id, target });
    mockGetPostData = jest.spyOn(post, "getPostData");
    mockGetPostData.mockResolvedValueOnce({ data: { text, files, targets } });
    mockVerifyTargetStatus = jest.spyOn(post, "verifyTargetStatus");
    mockVerifyTargetStatus.mockImplementationOnce(() => ({ err: undefined }));
    const provider = new Mastodon(db, bucket);
    updateDoc.mockResolvedValueOnce({});
    Mastodon.prototype.refreshAccessToken.mockResolvedValueOnce({
      err: "error",
    });
    mockSetPostStatusError = jest.spyOn(post, "setPostStatusError");
    mockSetPostStatusError.mockResolvedValueOnce({ err: "error" });

    // Execute
    const ret = await post.post();

    // Verify
    expect(mockGetPostData.mock.calls).toEqual([[]]);
    expect(mockVerifyTargetStatus.mock.calls).toEqual([[targets]]);
    expect(Mastodon.prototype.refreshAccessToken.mock.calls).toEqual([[]]);
    expect(Mastodon.prototype.post).not.toHaveBeenCalled();
    expect(updateDoc.mock.calls).toEqual([updateData01]);
    expect(mockSetPostStatusError.mock.calls).toEqual([["mastodon: error"]]);
    expect(ret).toEqual({ err: "error" });
  });

  it("should return error if post returns error.", async () => {
    // Prepare
    const post = new Post(db, bucket, { id, target });
    mockGetPostData = jest.spyOn(post, "getPostData");
    mockGetPostData.mockResolvedValueOnce({ data: { text, files, targets } });
    mockVerifyTargetStatus = jest.spyOn(post, "verifyTargetStatus");
    mockVerifyTargetStatus.mockImplementationOnce(() => ({ err: undefined }));
    const provider = new Mastodon(db, bucket);
    updateDoc.mockResolvedValueOnce({});
    Mastodon.prototype.refreshAccessToken.mockResolvedValueOnce({});
    Mastodon.prototype.post.mockResolvedValueOnce({ err: "error" });
    mockSetPostStatusError = jest.spyOn(post, "setPostStatusError");
    mockSetPostStatusError.mockResolvedValueOnce({ err: "error" });

    // Execute
    const ret = await post.post();

    // Verify
    expect(mockGetPostData.mock.calls).toEqual([[]]);
    expect(mockVerifyTargetStatus.mock.calls).toEqual([[targets]]);
    expect(Mastodon.prototype.refreshAccessToken.mock.calls).toEqual([[]]);
    expect(Mastodon.prototype.post.mock.calls).toEqual([[id, { text, files }]]);
    expect(updateDoc.mock.calls).toEqual([updateData01]);
    expect(mockSetPostStatusError.mock.calls).toEqual([["mastodon: error"]]);
    expect(ret).toEqual({ err: "error" });
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
          updatedAt: expect.any(Date),
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
          updatedAt: expect.any(Date),
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
          updatedAt: expect.any(Date),
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
