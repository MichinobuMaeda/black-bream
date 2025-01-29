const { describe, it, expect, afterEach } = require("@jest/globals");
const { Timestamp } = require("firebase-admin/firestore");
const axios = require("axios");
const { BskyAgent } = require("@atproto/api");
let { generateLinkCard } = require("./utils.js");

const {
  getQueueName,
  createPosts,
  deletePosts,
  post,
  checkCompleted,
  refreshThreadsAccessToken,
} = require("./post.js");

jest.mock("firebase-functions/logger");
jest.mock("axios");
jest.mock("@atproto/api");
BskyAgent.prototype.login = jest.fn(() => Promise.resolve());
BskyAgent.prototype.post = jest.fn(() => Promise.resolve());
BskyAgent.prototype.uploadBlob = jest.fn(() =>
  Promise.resolve({ data: { blob: new Uint8Array(10) } }),
);
jest.mock("./utils.js");

afterEach(() => {
  jest.clearAllMocks();
});

describe("getQueueName", () => {
  it("should return queue name", () => {
    // Prepare
    const project = "projectName";
    const location = "locationName";
    const functionName = "functionName";

    // Execute
    const result = getQueueName(project, location, functionName);

    // Verify
    expect(result).toBe(
      "projects/projectName/locations/locationName/functions/functionName",
    );
  });
});

describe("createPosts", () => {
  const queue = {
    enqueue: jest.fn(),
  };
  const data = {
    id: "id",
    data: () => ({
      targets: {
        target1: {},
        target2: {},
      },
      scheduledFor: {
        toDate: () => new Date("2021-01-01T00:00:00Z"),
      },
    }),
    ref: {
      update: jest.fn(() => Promise.resolve()),
    },
  };

  it("should create posts.", async () => {
    // Prepare

    // Execute
    const result = await createPosts(queue, data);

    // Verify
    expect(result).toEqual({ err: undefined, data: "enqueued" });
    expect(queue.enqueue.mock.calls).toEqual([
      [
        { id: "id", target: "target1" },
        { scheduleTime: expect.any(Date), id: "id-target1" },
      ],
      [
        { id: "id", target: "target2" },
        { scheduleTime: expect.any(Date), id: "id-target2" },
      ],
    ]);
    expect(data.ref.update.mock.calls).toEqual([
      [
        {
          status: "enqueued",
          targets: {
            target1: {
              status: "enqueued",
              scheduleTime: expect.any(Date),
              enqueuedAt: expect.any(Date),
              updatedAt: expect.any(Date),
              deletedAt: null,
            },
            target2: {
              status: "enqueued",
              scheduleTime: expect.any(Date),
              enqueuedAt: expect.any(Date),
              updatedAt: expect.any(Date),
              deletedAt: null,
            },
          },
          updatedAt: expect.any(Date),
          deletedAt: null,
        },
      ],
    ]);
  });

  it("should set error status, if queue.enqueue() raises exception.", async () => {
    // Prepare
    queue.enqueue
      .mockImplementationOnce(() => Promise.reject("error"))
      .mockImplementationOnce(() => Promise.reject("error"));

    // Execute
    const result = await createPosts(queue, data);

    // Verify
    expect(result).toEqual({ err: undefined, data: "enqueued" });
    expect(queue.enqueue.mock.calls).toEqual([
      [
        { id: "id", target: "target1" },
        { scheduleTime: expect.any(Date), id: "id-target1" },
      ],
      [
        { id: "id", target: "target2" },
        { scheduleTime: expect.any(Date), id: "id-target2" },
      ],
    ]);
    expect(data.ref.update.mock.calls).toEqual([
      [
        {
          status: "enqueued",
          targets: {
            target1: {
              status: "failed",
              err: "error",
              scheduleTime: expect.any(Date),
              enqueuedAt: null,
              updatedAt: expect.any(Date),
              deletedAt: null,
            },
            target2: {
              status: "failed",
              err: "error",
              scheduleTime: expect.any(Date),
              enqueuedAt: null,
              updatedAt: expect.any(Date),
              deletedAt: null,
            },
          },
          updatedAt: expect.any(Date),
          deletedAt: null,
        },
      ],
    ]);
  });

  it("should return error, if doc().update() exception is raised.", async () => {
    // Prepare
    data.ref.update.mockImplementationOnce(() => Promise.reject("error"));

    // Execute
    const result = await createPosts(queue, data);

    // Verify
    expect(result).toEqual({ err: "error", data: undefined });
    expect(queue.enqueue.mock.calls).toEqual([
      [
        { id: "id", target: "target1" },
        { scheduleTime: expect.any(Date), id: "id-target1" },
      ],
      [
        { id: "id", target: "target2" },
        { scheduleTime: expect.any(Date), id: "id-target2" },
      ],
    ]);
    expect(data.ref.update.mock.calls).toEqual([
      [
        {
          status: "enqueued",
          targets: {
            target1: {
              status: "enqueued",
              scheduleTime: expect.any(Date),
              enqueuedAt: expect.any(Date),
              updatedAt: expect.any(Date),
              deletedAt: null,
            },
            target2: {
              status: "enqueued",
              scheduleTime: expect.any(Date),
              enqueuedAt: expect.any(Date),
              updatedAt: expect.any(Date),
              deletedAt: null,
            },
          },
          updatedAt: expect.any(Date),
          deletedAt: null,
        },
      ],
    ]);
  });
});

describe("deletePosts", () => {
  const queue = {
    delete: jest.fn(),
  };
  const data = {
    id: "id",
    data: () => ({
      targets: {
        target1: {
          status: "enqueued",
          scheduleTime: expect.any(Date),
          enqueuedAt: expect.any(Date),
          updatedAt: expect.any(Date),
          deletedAt: null,
        },
        target2: {
          status: "enqueued",
          scheduleTime: expect.any(Date),
          enqueuedAt: expect.any(Date),
          updatedAt: expect.any(Date),
          deletedAt: null,
        },
      },
      scheduledFor: {
        toDate: () => new Date("2021-01-01T00:00:00Z"),
      },
    }),
    ref: {
      update: jest.fn(() => Promise.resolve()),
    },
  };

  it("should delete posts.", async () => {
    // Prepare

    // Execute
    const result = await deletePosts(queue, data);

    // Verify
    expect(result).toEqual({ err: undefined, data: "deleted" });
    expect(queue.delete.mock.calls).toEqual([["id-target1"], ["id-target2"]]);
    expect(data.ref.update.mock.calls).toEqual([
      [
        {
          status: "deleted",
          targets: {
            target1: {
              status: "deleted",
              scheduleTime: expect.any(Date),
              enqueuedAt: expect.any(Date),
              updatedAt: expect.any(Date),
              deletedAt: expect.any(Date),
            },
            target2: {
              status: "deleted",
              scheduleTime: expect.any(Date),
              enqueuedAt: expect.any(Date),
              updatedAt: expect.any(Date),
              deletedAt: expect.any(Date),
            },
          },
          updatedAt: expect.any(Date),
          deletedAt: expect.any(Date),
        },
      ],
    ]);
  });

  it("should set error status, if queue.delete() raises exception.", async () => {
    // Prepare
    queue.delete
      .mockImplementationOnce(() => Promise.reject("error"))
      .mockImplementationOnce(() => Promise.reject("error"));

    // Execute
    const result = await deletePosts(queue, data);

    // Verify
    expect(result).toEqual({ err: undefined, data: "deleted" });
    expect(queue.delete.mock.calls).toEqual([["id-target1"], ["id-target2"]]);
    expect(data.ref.update.mock.calls).toEqual([
      [
        {
          status: "deleted",
          targets: {
            target1: {
              status: "enqueued",
              err: "error",
              scheduleTime: expect.any(Date),
              enqueuedAt: expect.any(Date),
              updatedAt: expect.any(Date),
              deletedAt: null,
            },
            target2: {
              status: "enqueued",
              err: "error",
              scheduleTime: expect.any(Date),
              enqueuedAt: expect.any(Date),
              updatedAt: expect.any(Date),
              deletedAt: null,
            },
          },
          updatedAt: expect.any(Date),
          deletedAt: expect.any(Date),
        },
      ],
    ]);
  });

  it("should return error, if doc().update() exception is raised.", async () => {
    // Prepare
    data.ref.update.mockImplementationOnce(() => Promise.reject("error"));

    // Execute
    const result = await deletePosts(queue, data);

    // Verify
    expect(result).toEqual({ err: "error", data: undefined });
    expect(queue.delete.mock.calls).toEqual([["id-target1"], ["id-target2"]]);
    expect(data.ref.update.mock.calls).toEqual([
      [
        {
          status: "deleted",
          targets: {
            target1: {
              status: "deleted",
              scheduleTime: expect.any(Date),
              enqueuedAt: expect.any(Date),
              updatedAt: expect.any(Date),
              deletedAt: expect.any(Date),
            },
            target2: {
              status: "deleted",
              scheduleTime: expect.any(Date),
              enqueuedAt: expect.any(Date),
              updatedAt: expect.any(Date),
              deletedAt: expect.any(Date),
            },
          },
          updatedAt: expect.any(Date),
          deletedAt: expect.any(Date),
        },
      ],
    ]);
  });
});

describe("post", () => {
  const postData = {
    targets: {
      mastodon: {
        status: "enqueued",
        scheduleTime: expect.any(Date),
        enqueuedAt: expect.any(Date),
        updatedAt: expect.any(Date),
        deletedAt: null,
      },
      bluesky: {
        status: "enqueued",
        scheduleTime: expect.any(Date),
        enqueuedAt: expect.any(Date),
        updatedAt: expect.any(Date),
        deletedAt: null,
      },
      threads: {
        status: "enqueued",
        scheduleTime: expect.any(Date),
        enqueuedAt: expect.any(Date),
        updatedAt: expect.any(Date),
        deletedAt: null,
      },
      dummy: {
        status: "enqueued",
        scheduleTime: expect.any(Date),
        enqueuedAt: expect.any(Date),
        updatedAt: expect.any(Date),
        deletedAt: null,
      },
    },
    text: "Text",
  };
  const postSnap = {
    exists: true,
    id: "post-id",
    data: jest.fn(() => postData),
    get: jest.fn((key) => postData[key]),
  };
  const postRef = {
    get: jest.fn(() => Promise.resolve(postSnap)),
    update: jest.fn(() => Promise.resolve()),
  };
  const authData = {
    mastodon: {
      url: "https://mastodon.example.com",
      token: "mastodon-token",
    },
    bluesky: {
      service: "https://bluesky.example.com",
      identifier: "bluesky-identifier",
      password: "bluesky-password",
    },
    threads: {
      userId: "threads-userId",
      accessToken: "threads-accessToken",
    },
    dummy: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const authSnap = {
    exists: true,
    data: () => authData,
    get: jest.fn((key) => authData[key]),
  };
  const authRef = {
    get: jest.fn(() => Promise.resolve(authSnap)),
  };
  const collection = {
    doc: jest.fn(),
  };
  const db = {
    collection: jest.fn(() => collection),
  };

  it("should return error, if failed to get post doc.", async () => {
    // Prepare
    postRef.get.mockImplementationOnce(() =>
      Promise.resolve({ exists: false }),
    );
    collection.doc.mockImplementationOnce(() => postRef);

    // Execute
    const result = await post(db, {
      id: "post-id",
      target: "target1",
      text: "Text",
    });

    // Verify
    expect(result).toEqual({
      err: "Not found: posts/post-id",
      data: undefined,
    });
    expect(db.collection.mock.calls).toEqual([["posts"]]);
    expect(collection.doc.mock.calls).toEqual([["post-id"]]);
    expect(postRef.get.mock.calls).toEqual([[]]);
    expect(postRef.update).not.toHaveBeenCalled();
    expect(authRef.get).not.toHaveBeenCalled();
    expect(authSnap.get).not.toHaveBeenCalled();
    expect(axios.post).not.toHaveBeenCalled();
  });

  it("should return error, if post is already deleted.", async () => {
    // Prepare
    collection.doc.mockImplementationOnce(() => postRef);
    postSnap.get.mockImplementationOnce(() => new Date());

    // Execute
    const result = await post(db, { id: "post-id", target: "target1" });

    // Verify
    expect(result).toEqual({
      err: "Deleted: posts/post-id",
      data: undefined,
    });
    expect(db.collection.mock.calls).toEqual([["posts"]]);
    expect(collection.doc.mock.calls).toEqual([["post-id"]]);
    expect(postRef.get.mock.calls).toEqual([[]]);
    expect(postRef.update.mock.calls).toEqual([
      [
        {
          status: "posting",
          "targets.target1": {
            status: "failed",
            err: "Deleted: posts/post-id",
            updatedAt: expect.any(Date),
          },
          updatedAt: expect.any(Date),
        },
      ],
    ]);
    expect(authRef.get).not.toHaveBeenCalled();
    expect(authSnap.get).not.toHaveBeenCalled();
    expect(axios.post).not.toHaveBeenCalled();
  });

  it("should return error, if failed to get auth doc.", async () => {
    // Prepare
    collection.doc
      .mockImplementationOnce(() => postRef)
      .mockImplementationOnce(() => authRef);
    authRef.get.mockImplementationOnce(() =>
      Promise.resolve({ exists: false }),
    );

    // Execute
    const result = await post(db, { id: "post-id", target: "mastodon" });

    // Verify
    expect(result).toEqual({
      err: "Not found: service/auth",
      data: undefined,
    });
    expect(db.collection.mock.calls).toEqual([["posts"], ["service"]]);
    expect(collection.doc.mock.calls).toEqual([["post-id"], ["auth"]]);
    expect(postRef.get.mock.calls).toEqual([[]]);
    expect(postRef.update.mock.calls).toEqual([
      [
        {
          status: "posting",
          "targets.mastodon": {
            status: "failed",
            err: "Not found: service/auth",
            updatedAt: expect.any(Date),
          },
          updatedAt: expect.any(Date),
        },
      ],
    ]);
    expect(authRef.get.mock.calls).toEqual([[]]);
    expect(authSnap.get).not.toHaveBeenCalled();
    expect(axios.post).not.toHaveBeenCalled();
  });

  it("should return error, if auth doc is already deleted.", async () => {
    // Prepare
    collection.doc
      .mockImplementationOnce(() => postRef)
      .mockImplementationOnce(() => authRef);
    authSnap.get.mockImplementationOnce(() => new Date());

    // Execute
    const result = await post(db, { id: "post-id", target: "mastodon" });

    // Verify
    expect(result).toEqual({
      err: "Deleted: service/auth",
      data: undefined,
    });
    expect(db.collection.mock.calls).toEqual([["posts"], ["service"]]);
    expect(collection.doc.mock.calls).toEqual([["post-id"], ["auth"]]);
    expect(postRef.get.mock.calls).toEqual([[]]);
    expect(postRef.update.mock.calls).toEqual([
      [
        {
          status: "posting",
          "targets.mastodon": {
            status: "failed",
            err: "Deleted: service/auth",
            updatedAt: expect.any(Date),
          },
          updatedAt: expect.any(Date),
        },
      ],
    ]);
    expect(authRef.get.mock.calls).toEqual([[]]);
    expect(authSnap.get.mock.calls).toEqual([["deletedAt"]]);
    expect(axios.post).not.toHaveBeenCalled();
  });

  it("should return error, if the target status is not enqueued.", async () => {
    // Prepare
    collection.doc.mockImplementationOnce(() => postRef);
    postSnap.get
      .mockImplementationOnce(() => null)
      .mockImplementationOnce(() => ({
        target1: { status: "failed" },
      }));

    // Execute
    const result = await post(db, { id: "post-id", target: "target1" });

    // Verify
    expect(result).toEqual({
      err: "Invalid status: target1.status: failed",
      data: undefined,
    });
    expect(db.collection.mock.calls).toEqual([["posts"]]);
    expect(collection.doc.mock.calls).toEqual([["post-id"]]);
    expect(postRef.get.mock.calls).toEqual([[]]);
    expect(postRef.update.mock.calls).toEqual([
      [
        {
          status: "posting",
          "targets.target1": {
            status: "failed",
            err: "Invalid status: target1.status: failed",
            updatedAt: expect.any(Date),
          },
          updatedAt: expect.any(Date),
        },
      ],
    ]);
    expect(authRef.get).not.toHaveBeenCalled();
    expect(authSnap.get).not.toHaveBeenCalled();
    expect(axios.post).not.toHaveBeenCalled();
  });

  it("should return error, if the target is already deleted.", async () => {
    // Prepare
    collection.doc.mockImplementationOnce(() => postRef);
    postSnap.get
      .mockImplementationOnce(() => null)
      .mockImplementationOnce(() => ({
        target1: { status: "enqueued", deletedAt: new Date() },
      }));

    // Execute
    const result = await post(db, { id: "post-id", target: "target1" });

    // Verify
    expect(result).toEqual({
      err: "Invalid status: target1 is deleted",
      data: undefined,
    });
    expect(db.collection.mock.calls).toEqual([["posts"]]);
    expect(collection.doc.mock.calls).toEqual([["post-id"]]);
    expect(postRef.get.mock.calls).toEqual([[]]);
    expect(postRef.update.mock.calls).toEqual([
      [
        {
          status: "posting",
          "targets.target1": {
            status: "failed",
            err: "Invalid status: target1 is deleted",
            updatedAt: expect.any(Date),
          },
          updatedAt: expect.any(Date),
        },
      ],
    ]);
    expect(authRef.get).not.toHaveBeenCalled();
    expect(authSnap.get).not.toHaveBeenCalled();
    expect(axios.post).not.toHaveBeenCalled();
  });

  it("should return error, if failed to get the target params.", async () => {
    // Prepare
    collection.doc
      .mockImplementationOnce(() => postRef)
      .mockImplementationOnce(() => authRef);
    postSnap.get
      .mockImplementationOnce(() => null)
      .mockImplementationOnce(() => ({
        target1: { status: "enqueued" },
      }));

    // Execute
    const result = await post(db, { id: "post-id", target: "target1" });

    // Verify
    expect(result).toEqual({
      err: "Not found: target1 in service/auth",
      data: undefined,
    });
    expect(db.collection.mock.calls).toEqual([["posts"], ["service"]]);
    expect(collection.doc.mock.calls).toEqual([["post-id"], ["auth"]]);
    expect(postRef.get.mock.calls).toEqual([[]]);
    expect(postRef.update.mock.calls).toEqual([
      [
        {
          status: "posting",
          "targets.target1": {
            status: "failed",
            err: "Not found: target1 in service/auth",
            updatedAt: expect.any(Date),
          },
          updatedAt: expect.any(Date),
        },
      ],
    ]);
    expect(authRef.get.mock.calls).toEqual([[]]);
    expect(authSnap.get.mock.calls).toEqual([["deletedAt"], ["target1"]]);
    expect(axios.post).not.toHaveBeenCalled();
  });

  it("should return error, if the target params is already deleted.", async () => {
    // Prepare
    collection.doc
      .mockImplementationOnce(() => postRef)
      .mockImplementationOnce(() => authRef);
    postSnap.get
      .mockImplementationOnce(() => null)
      .mockImplementationOnce(() => ({
        target1: { status: "enqueued" },
      }));
    authSnap.get
      .mockImplementationOnce(() => null)
      .mockImplementationOnce(() => ({ deletedAt: new Date() }));

    // Execute
    const result = await post(db, { id: "post-id", target: "target1" });

    // Verify
    expect(result).toEqual({
      err: "Deleted: target1 in service/auth",
      data: undefined,
    });
    expect(db.collection.mock.calls).toEqual([["posts"], ["service"]]);
    expect(collection.doc.mock.calls).toEqual([["post-id"], ["auth"]]);
    expect(postRef.get.mock.calls).toEqual([[]]);
    expect(postRef.update.mock.calls).toEqual([
      [
        {
          status: "posting",
          "targets.target1": {
            status: "failed",
            err: "Deleted: target1 in service/auth",
            updatedAt: expect.any(Date),
          },
          updatedAt: expect.any(Date),
        },
      ],
    ]);
    expect(authRef.get.mock.calls).toEqual([[]]);
    expect(authSnap.get.mock.calls).toEqual([["deletedAt"], ["target1"]]);
    expect(axios.post).not.toHaveBeenCalled();
  });

  it("should post to Mastodon.", async () => {
    // Prepare
    collection.doc
      .mockImplementationOnce(() => postRef)
      .mockImplementationOnce(() => authRef);
    axios.post.mockImplementationOnce(() => Promise.resolve({ status: 200 }));

    // Execute
    const result = await post(db, { id: "post-id", target: "mastodon" });

    // Verify
    expect(result).toEqual({ err: undefined, data: "posting" });
    expect(db.collection.mock.calls).toEqual([["posts"], ["service"]]);
    expect(collection.doc.mock.calls).toEqual([["post-id"], ["auth"]]);
    expect(postRef.get.mock.calls).toEqual([[]]);
    expect(postRef.update.mock.calls).toEqual([
      [
        {
          status: "posting",
          "targets.mastodon": {
            status: "completed",
            updatedAt: expect.any(Date),
          },
          updatedAt: expect.any(Date),
        },
      ],
    ]);
    expect(authRef.get.mock.calls).toEqual([[]]);
    expect(authSnap.get.mock.calls).toEqual([["deletedAt"], ["mastodon"]]);
    expect(axios.post.mock.calls).toEqual([
      [
        authData.mastodon.url,
        {
          status: "Text",
          sensitive: "false",
          visibility: "public",
          language: "ja",
        },
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${authData.mastodon.token}`,
            "Idempotency-Key": expect.any(String),
          },
        },
      ],
    ]);
  });

  it("should return error, if axis.post raises an exception for Mastodon.", async () => {
    // Prepare
    collection.doc
      .mockImplementationOnce(() => postRef)
      .mockImplementationOnce(() => authRef);
    axios.post.mockImplementationOnce(() => Promise.reject("error"));

    // Execute
    const result = await post(db, { id: "post-id", target: "mastodon" });

    // Verify
    expect(result).toEqual({ err: "mastodon: error", data: undefined });
    expect(db.collection.mock.calls).toEqual([["posts"], ["service"]]);
    expect(collection.doc.mock.calls).toEqual([["post-id"], ["auth"]]);
    expect(postRef.get.mock.calls).toEqual([[]]);
    expect(postRef.update.mock.calls).toEqual([
      [
        {
          status: "posting",
          "targets.mastodon": {
            status: "failed",
            err: "mastodon: error",
            updatedAt: expect.any(Date),
          },
          updatedAt: expect.any(Date),
        },
      ],
    ]);
    expect(authRef.get.mock.calls).toEqual([[]]);
    expect(authSnap.get.mock.calls).toEqual([["deletedAt"], ["mastodon"]]);
    expect(axios.post.mock.calls).toEqual([
      [
        authData.mastodon.url,
        {
          status: "Text",
          sensitive: "false",
          visibility: "public",
          language: "ja",
        },
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${authData.mastodon.token}`,
            "Idempotency-Key": expect.any(String),
          },
        },
      ],
    ]);
  });

  it("should return error, if axis.post returns error status for Mastodon.", async () => {
    // Prepare
    collection.doc
      .mockImplementationOnce(() => postRef)
      .mockImplementationOnce(() => authRef);
    axios.post.mockImplementationOnce(() =>
      Promise.resolve({ status: 500, statusText: "Server error" }),
    );

    // Execute
    const result = await post(db, { id: "post-id", target: "mastodon" });

    // Verify
    expect(result).toEqual({
      err: "mastodon: 500 Server error",
      data: undefined,
    });
    expect(db.collection.mock.calls).toEqual([["posts"], ["service"]]);
    expect(collection.doc.mock.calls).toEqual([["post-id"], ["auth"]]);
    expect(postRef.get.mock.calls).toEqual([[]]);
    expect(postRef.update.mock.calls).toEqual([
      [
        {
          status: "posting",
          "targets.mastodon": {
            status: "failed",
            err: "mastodon: 500 Server error",
            updatedAt: expect.any(Date),
          },
          updatedAt: expect.any(Date),
        },
      ],
    ]);
    expect(authRef.get.mock.calls).toEqual([[]]);
    expect(authSnap.get.mock.calls).toEqual([["deletedAt"], ["mastodon"]]);
    expect(axios.post.mock.calls).toEqual([
      [
        authData.mastodon.url,
        {
          status: "Text",
          sensitive: "false",
          visibility: "public",
          language: "ja",
        },
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${authData.mastodon.token}`,
            "Idempotency-Key": expect.any(String),
          },
        },
      ],
    ]);
  });

  it("should post to Bluesky.", async () => {
    // Prepare
    collection.doc
      .mockImplementationOnce(() => postRef)
      .mockImplementationOnce(() => authRef);
    generateLinkCard.mockImplementationOnce(() => ({
      err: undefined,
      data: null,
    }));

    // Execute
    const result = await post(db, { id: "post-id", target: "bluesky" });

    // Verify
    expect(result).toEqual({ err: undefined, data: "posting" });
    expect(db.collection.mock.calls).toEqual([["posts"], ["service"]]);
    expect(collection.doc.mock.calls).toEqual([["post-id"], ["auth"]]);
    expect(postRef.get.mock.calls).toEqual([[]]);
    expect(postRef.update.mock.calls).toEqual([
      [
        {
          status: "posting",
          "targets.bluesky": {
            status: "completed",
            updatedAt: expect.any(Date),
          },
          updatedAt: expect.any(Date),
        },
      ],
    ]);
    expect(authRef.get.mock.calls).toEqual([[]]);
    expect(authSnap.get.mock.calls).toEqual([["deletedAt"], ["bluesky"]]);
    expect(BskyAgent.prototype.login.mock.calls).toEqual([
      [{ identifier: "bluesky-identifier", password: "bluesky-password" }],
    ]);
    expect(BskyAgent.prototype.post.mock.calls).toEqual([
      [{ text: "Text", langs: ["ja"] }],
    ]);
  });

  it("should post to Bluesky with an link card, if text includes url. #1", async () => {
    // Prepare
    postSnap.data.mockImplementationOnce(() => ({
      text: "Text https://example.com",
    }));
    collection.doc
      .mockImplementationOnce(() => postRef)
      .mockImplementationOnce(() => authRef);
    generateLinkCard.mockImplementationOnce(() =>
      Promise.resolve({
        err: undefined,
        data: {
          uri: "https://example.com",
          title: "Title",
          description: "Description",
          thumbUrl: "https://example.com/thumb.jpg",
        },
      }),
    );
    axios.get.mockImplementationOnce(() =>
      Promise.resolve({
        status: 200,
        data: new ArrayBuffer(10),
      }),
    );

    // Execute
    const result = await post(db, { id: "post-id", target: "bluesky" });

    // Verify
    expect(result).toEqual({ err: undefined, data: "posting" });
    expect(db.collection.mock.calls).toEqual([["posts"], ["service"]]);
    expect(collection.doc.mock.calls).toEqual([["post-id"], ["auth"]]);
    expect(postRef.get.mock.calls).toEqual([[]]);
    expect(postRef.update.mock.calls).toEqual([
      [
        {
          status: "posting",
          "targets.bluesky": {
            status: "completed",
            updatedAt: expect.any(Date),
          },
          updatedAt: expect.any(Date),
        },
      ],
    ]);
    expect(authRef.get.mock.calls).toEqual([[]]);
    expect(authSnap.get.mock.calls).toEqual([["deletedAt"], ["bluesky"]]);
    expect(BskyAgent.prototype.login.mock.calls).toEqual([
      [{ identifier: "bluesky-identifier", password: "bluesky-password" }],
    ]);
    expect(BskyAgent.prototype.post.mock.calls).toEqual([
      [
        {
          text: "Text https://example.com",
          langs: ["ja"],
          embed: {
            $type: "app.bsky.embed.external",
            external: {
              uri: "https://example.com",
              title: "Title",
              description: "Description",
              thumb: expect.any(Uint8Array),
            },
          },
        },
      ],
    ]);
    expect(axios.get.mock.calls).toEqual([
      [
        "https://example.com/thumb.jpg",
        {
          responseType: "arraybuffer",
        },
      ],
    ]);
  });

  it("should post to Bluesky with an link card, if text includes url. #2", async () => {
    // Prepare
    postSnap.data.mockImplementationOnce(() => ({
      text: "Text https://example.com",
    }));
    collection.doc
      .mockImplementationOnce(() => postRef)
      .mockImplementationOnce(() => authRef);
    generateLinkCard.mockImplementationOnce(() =>
      Promise.resolve({
        err: undefined,
        data: {
          uri: "https://example.com",
          title: "Title",
          description: "Description",
          thumbUrl: null,
        },
      }),
    );

    // Execute
    const result = await post(db, { id: "post-id", target: "bluesky" });

    // Verify
    expect(result).toEqual({ err: undefined, data: "posting" });
    expect(db.collection.mock.calls).toEqual([["posts"], ["service"]]);
    expect(collection.doc.mock.calls).toEqual([["post-id"], ["auth"]]);
    expect(postRef.get.mock.calls).toEqual([[]]);
    expect(postRef.update.mock.calls).toEqual([
      [
        {
          status: "posting",
          "targets.bluesky": {
            status: "completed",
            updatedAt: expect.any(Date),
          },
          updatedAt: expect.any(Date),
        },
      ],
    ]);
    expect(authRef.get.mock.calls).toEqual([[]]);
    expect(authSnap.get.mock.calls).toEqual([["deletedAt"], ["bluesky"]]);
    expect(BskyAgent.prototype.login.mock.calls).toEqual([
      [{ identifier: "bluesky-identifier", password: "bluesky-password" }],
    ]);
    expect(BskyAgent.prototype.post.mock.calls).toEqual([
      [
        {
          text: "Text https://example.com",
          langs: ["ja"],
          embed: {
            $type: "app.bsky.embed.external",
            external: {
              uri: "https://example.com",
              title: "Title",
              description: "Description",
              thumb: undefined,
            },
          },
        },
      ],
    ]);
    expect(axios.get).not.toHaveBeenCalled();
  });

  it("should post to Bluesky with an link card, if text includes url. #3", async () => {
    // Prepare
    postSnap.data.mockImplementationOnce(() => ({
      text: "Text https://example.com",
    }));
    collection.doc
      .mockImplementationOnce(() => postRef)
      .mockImplementationOnce(() => authRef);
    generateLinkCard.mockImplementationOnce(() =>
      Promise.resolve({
        err: undefined,
        data: {
          uri: "https://example.com",
          title: "Title",
          description: "Description",
          thumbUrl: "https://example.com/thumb.jpg",
        },
      }),
    );
    axios.get.mockImplementationOnce(() =>
      Promise.resolve({
        status: 404,
        data: undefined,
      }),
    );

    // Execute
    const result = await post(db, { id: "post-id", target: "bluesky" });

    // Verify
    expect(result).toEqual({ err: undefined, data: "posting" });
    expect(db.collection.mock.calls).toEqual([["posts"], ["service"]]);
    expect(collection.doc.mock.calls).toEqual([["post-id"], ["auth"]]);
    expect(postRef.get.mock.calls).toEqual([[]]);
    expect(postRef.update.mock.calls).toEqual([
      [
        {
          status: "posting",
          "targets.bluesky": {
            status: "completed",
            updatedAt: expect.any(Date),
          },
          updatedAt: expect.any(Date),
        },
      ],
    ]);
    expect(authRef.get.mock.calls).toEqual([[]]);
    expect(authSnap.get.mock.calls).toEqual([["deletedAt"], ["bluesky"]]);
    expect(BskyAgent.prototype.login.mock.calls).toEqual([
      [{ identifier: "bluesky-identifier", password: "bluesky-password" }],
    ]);
    expect(BskyAgent.prototype.post.mock.calls).toEqual([
      [
        {
          text: "Text https://example.com",
          langs: ["ja"],
          embed: {
            $type: "app.bsky.embed.external",
            external: {
              uri: "https://example.com",
              title: "Title",
              description: "Description",
              thumb: undefined,
            },
          },
        },
      ],
    ]);
    expect(axios.get.mock.calls).toEqual([
      [
        "https://example.com/thumb.jpg",
        {
          responseType: "arraybuffer",
        },
      ],
    ]);
  });

  it(
    "should return error," +
      " if Bluesky.post raises an exception for Bluesky.",
    async () => {
      // Prepare
      collection.doc
        .mockImplementationOnce(() => postRef)
        .mockImplementationOnce(() => authRef);
      generateLinkCard.mockImplementationOnce(() =>
        Promise.resolve({ err: undefined, data: null }),
      );
      BskyAgent.prototype.post.mockImplementationOnce(() =>
        Promise.reject("error"),
      );

      // Execute
      const result = await post(db, { id: "post-id", target: "bluesky" });

      // Verify
      expect(result).toEqual({ err: "bluesky: error", data: undefined });
      expect(db.collection.mock.calls).toEqual([["posts"], ["service"]]);
      expect(collection.doc.mock.calls).toEqual([["post-id"], ["auth"]]);
      expect(postRef.get.mock.calls).toEqual([[]]);
      expect(postRef.update.mock.calls).toEqual([
        [
          {
            status: "posting",
            "targets.bluesky": {
              status: "failed",
              err: "bluesky: error",
              updatedAt: expect.any(Date),
            },
            updatedAt: expect.any(Date),
          },
        ],
      ]);
      expect(authRef.get.mock.calls).toEqual([[]]);
      expect(authSnap.get.mock.calls).toEqual([["deletedAt"], ["bluesky"]]);
      expect(BskyAgent.prototype.login.mock.calls).toEqual([
        [{ identifier: "bluesky-identifier", password: "bluesky-password" }],
      ]);
      expect(BskyAgent.prototype.post.mock.calls).toEqual([
        [{ text: "Text", langs: ["ja"] }],
      ]);
    },
  );

  it("should return error, if target is not supported for Bluesky.", async () => {
    // Prepare
    collection.doc
      .mockImplementationOnce(() => postRef)
      .mockImplementationOnce(() => authRef);
    generateLinkCard.mockImplementationOnce(() =>
      Promise.resolve({ err: undefined, data: null }),
    );

    // Execute
    const result = await post(db, { id: "post-id", target: "dummy" });

    // Verify
    expect(result).toEqual({
      err: "Unsupported target: dummy",
      data: undefined,
    });
    expect(db.collection.mock.calls).toEqual([["posts"], ["service"]]);
    expect(collection.doc.mock.calls).toEqual([["post-id"], ["auth"]]);
    expect(postRef.get.mock.calls).toEqual([[]]);
    expect(postRef.update.mock.calls).toEqual([
      [
        {
          status: "posting",
          "targets.dummy": {
            status: "failed",
            err: "Unsupported target: dummy",
            updatedAt: expect.any(Date),
          },
          updatedAt: expect.any(Date),
        },
      ],
    ]);
    expect(authRef.get.mock.calls).toEqual([[]]);
    expect(authSnap.get.mock.calls).toEqual([["deletedAt"], ["dummy"]]);
    expect(axios.post).not.toHaveBeenCalled();
  });

  it("should post to Threads.", async () => {
    // Prepare
    collection.doc
      .mockImplementationOnce(() => postRef)
      .mockImplementationOnce(() => authRef);
    axios.post
      .mockImplementationOnce(() =>
        Promise.resolve({ status: 200, data: { id: "01234566789" } }),
      )
      .mockImplementationOnce(() => Promise.resolve({ status: 200 }));

    // Execute
    const result = await post(db, { id: "post-id", target: "threads" });

    // Verify
    expect(result).toEqual({ err: undefined, data: "posting" });
    expect(db.collection.mock.calls).toEqual([["posts"], ["service"]]);
    expect(collection.doc.mock.calls).toEqual([["post-id"], ["auth"]]);
    expect(postRef.get.mock.calls).toEqual([[]]);
    expect(postRef.update.mock.calls).toEqual([
      [
        {
          status: "posting",
          "targets.threads": {
            status: "completed",
            updatedAt: expect.any(Date),
          },
          updatedAt: expect.any(Date),
        },
      ],
    ]);
    expect(authRef.get.mock.calls).toEqual([[]]);
    expect(authSnap.get.mock.calls).toEqual([["deletedAt"], ["threads"]]);
    expect(axios.post.mock.calls).toEqual([
      [
        `https://graph.threads.net/v1.0/${authData.threads.userId}/threads` +
          "?media_type=TEXT" +
          `&text=${encodeURIComponent("Text")}` +
          `&access_token=${authData.threads.accessToken}`,
      ],
      [
        `https://graph.threads.net/v1.0/${authData.threads.userId}/threads_publish` +
          "?creation_id=01234566789" +
          `&access_token=${authData.threads.accessToken}`,
      ],
    ]);
  });

  it("should return error, if axis.post raises an exception for Threads.", async () => {
    // Prepare
    collection.doc
      .mockImplementationOnce(() => postRef)
      .mockImplementationOnce(() => authRef);
    axios.post.mockImplementationOnce(() => Promise.reject("error"));

    // Execute
    const result = await post(db, { id: "post-id", target: "threads" });

    // Verify
    expect(result).toEqual({ err: "threads: error", data: undefined });
    expect(db.collection.mock.calls).toEqual([["posts"], ["service"]]);
    expect(collection.doc.mock.calls).toEqual([["post-id"], ["auth"]]);
    expect(postRef.get.mock.calls).toEqual([[]]);
    expect(postRef.update.mock.calls).toEqual([
      [
        {
          status: "posting",
          "targets.threads": {
            status: "failed",
            err: "threads: error",
            updatedAt: expect.any(Date),
          },
          updatedAt: expect.any(Date),
        },
      ],
    ]);
    expect(authRef.get.mock.calls).toEqual([[]]);
    expect(authSnap.get.mock.calls).toEqual([["deletedAt"], ["threads"]]);
    expect(axios.post.mock.calls).toEqual([
      [
        `https://graph.threads.net/v1.0/${authData.threads.userId}/threads` +
          "?media_type=TEXT" +
          `&text=${encodeURIComponent("Text")}` +
          `&access_token=${authData.threads.accessToken}`,
      ],
    ]);
  });

  it("should return error, if axis.post returns error status for Threads.", async () => {
    // Prepare
    collection.doc
      .mockImplementationOnce(() => postRef)
      .mockImplementationOnce(() => authRef);
    axios.post.mockImplementationOnce(() =>
      Promise.resolve({ status: 500, statusText: "Server error" }),
    );

    // Execute
    const result = await post(db, { id: "post-id", target: "threads" });

    // Verify
    expect(result).toEqual({
      err: "threads: Failed to create container: 500 Server error",
      data: undefined,
    });
    expect(db.collection.mock.calls).toEqual([["posts"], ["service"]]);
    expect(collection.doc.mock.calls).toEqual([["post-id"], ["auth"]]);
    expect(postRef.get.mock.calls).toEqual([[]]);
    expect(postRef.update.mock.calls).toEqual([
      [
        {
          status: "posting",
          "targets.threads": {
            status: "failed",
            err: "threads: Failed to create container: 500 Server error",
            updatedAt: expect.any(Date),
          },
          updatedAt: expect.any(Date),
        },
      ],
    ]);
    expect(authRef.get.mock.calls).toEqual([[]]);
    expect(authSnap.get.mock.calls).toEqual([["deletedAt"], ["threads"]]);
    expect(axios.post.mock.calls).toEqual([
      [
        `https://graph.threads.net/v1.0/${authData.threads.userId}/threads` +
          "?media_type=TEXT" +
          `&text=${encodeURIComponent("Text")}` +
          `&access_token=${authData.threads.accessToken}`,
      ],
    ]);
  });

  it("should return error, if axis.post returns error status for Threads #2.", async () => {
    // Prepare
    collection.doc
      .mockImplementationOnce(() => postRef)
      .mockImplementationOnce(() => authRef);
    axios.post
      .mockImplementationOnce(() =>
        Promise.resolve({ status: 200, data: { id: "01234566789" } }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({ status: 500, statusText: "Server error" }),
      );

    // Execute
    const result = await post(db, { id: "post-id", target: "threads" });

    // Verify
    expect(result).toEqual({
      err: "threads: Failed to publish: 500 Server error",
      data: undefined,
    });
    expect(db.collection.mock.calls).toEqual([["posts"], ["service"]]);
    expect(collection.doc.mock.calls).toEqual([["post-id"], ["auth"]]);
    expect(postRef.get.mock.calls).toEqual([[]]);
    expect(postRef.update.mock.calls).toEqual([
      [
        {
          status: "posting",
          "targets.threads": {
            status: "failed",
            err: "threads: Failed to publish: 500 Server error",
            updatedAt: expect.any(Date),
          },
          updatedAt: expect.any(Date),
        },
      ],
    ]);
    expect(authRef.get.mock.calls).toEqual([[]]);
    expect(authSnap.get.mock.calls).toEqual([["deletedAt"], ["threads"]]);
    expect(axios.post.mock.calls).toEqual([
      [
        `https://graph.threads.net/v1.0/${authData.threads.userId}/threads` +
          "?media_type=TEXT" +
          `&text=${encodeURIComponent("Text")}` +
          `&access_token=${authData.threads.accessToken}`,
      ],
      [
        `https://graph.threads.net/v1.0/${authData.threads.userId}/threads_publish` +
          "?creation_id=01234566789" +
          `&access_token=${authData.threads.accessToken}`,
      ],
    ]);
  });

  it(
    "should return error," +
      " if target is postRef.update() raises an exception.",
    async () => {
      // Prepare
      collection.doc
        .mockImplementationOnce(() => postRef)
        .mockImplementationOnce(() => authRef);
      axios.post.mockImplementationOnce(() => Promise.resolve({ status: 200 }));
      postRef.update
        .mockImplementationOnce(() => Promise.reject("error"))
        .mockImplementationOnce(() => Promise.reject("error"));

      // Execute
      const result = await post(db, { id: "post-id", target: "mastodon" });

      // Verify
      expect(result).toEqual({ err: "error", data: undefined });
      expect(db.collection.mock.calls).toEqual([["posts"], ["service"]]);
      expect(collection.doc.mock.calls).toEqual([["post-id"], ["auth"]]);
      expect(postRef.get.mock.calls).toEqual([[]]);
      expect(postRef.update.mock.calls).toEqual([
        [
          {
            status: "posting",
            "targets.mastodon": {
              status: "completed",
              updatedAt: expect.any(Date),
            },
            updatedAt: expect.any(Date),
          },
        ],
        [
          {
            status: "posting",
            "targets.mastodon": {
              err: "error",
              status: "failed",
              updatedAt: expect.any(Date),
            },
            updatedAt: expect.any(Date),
          },
        ],
      ]);
      expect(authRef.get.mock.calls).toEqual([[]]);
      expect(authSnap.get.mock.calls).toEqual([["deletedAt"], ["mastodon"]]);
      expect(axios.post.mock.calls).toEqual([
        [
          authData.mastodon.url,
          {
            status: "Text",
            sensitive: "false",
            visibility: "public",
            language: "ja",
          },
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${authData.mastodon.token}`,
              "Idempotency-Key": expect.any(String),
            },
          },
        ],
      ]);
    },
  );
});

describe("checkCompleted", () => {
  it("should return 'completed', if all targets are completed.", async () => {
    // Prepare
    const data = {
      status: "posting",
      targets: {
        target1: { status: "completed" },
        target2: { status: "completed" },
      },
    };
    const doc = {
      data: () => data,
      ref: {
        update: jest.fn(() => Promise.resolve()),
      },
    };

    // Execute
    const result = await checkCompleted(doc);

    // Verify
    expect(result).toEqual({ err: undefined, data: "completed" });
    expect(doc.ref.update.mock.calls).toEqual([
      [
        {
          status: "completed",
          updatedAt: expect.any(Date),
        },
      ],
    ]);
  });

  it("should return 'failed', if some targets are failed.", async () => {
    // Prepare
    const data = {
      status: "posting",
      targets: {
        target1: { status: "completed" },
        target2: { status: "failed" },
      },
    };
    const doc = {
      data: () => data,
      ref: {
        update: jest.fn(() => Promise.resolve()),
      },
    };

    // Execute
    const result = await checkCompleted(doc);

    // Verify
    expect(result).toEqual({ err: undefined, data: "failed" });
    expect(doc.ref.update.mock.calls).toEqual([
      [
        {
          status: "failed",
          updatedAt: expect.any(Date),
        },
      ],
    ]);
  });

  it("should return current status, if some targets are not processed.", async () => {
    // Prepare
    const data = {
      status: "posting",
      targets: {
        target1: { status: "completed" },
        target2: { status: "posting" },
      },
    };
    const doc = {
      data: () => data,
      ref: {
        update: jest.fn(() => Promise.resolve()),
      },
    };

    // Execute
    const result = await checkCompleted(doc);

    // Verify
    expect(result).toEqual({ err: undefined, data: "posting" });
    expect(doc.ref.update).not.toHaveBeenCalled();
  });

  it("should return error, if it is rejected.", async () => {
    // Prepare
    const data = {
      status: "posting",
      targets: {
        target1: { status: "completed" },
        target2: { status: "completed" },
      },
    };
    const doc = {
      data: () => data,
      ref: {
        update: jest.fn(() => Promise.reject("error")),
      },
    };

    // Execute
    const result = await checkCompleted(doc);

    // Verify
    expect(result).toEqual({ err: "error", data: undefined });
    expect(doc.ref.update.mock.calls).toEqual([
      [
        {
          status: "completed",
          updatedAt: expect.any(Date),
        },
      ],
    ]);
  });
});

describe("refreshThreadsAccessToken", () => {
  const authData = {
    threads: {
      userId: "threads-userId",
      accessToken: "threads-accessToken",
    },
    dummy: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const authSnap = {
    exists: true,
    data: () => authData,
    get: jest.fn((key) => authData[key]),
  };
  const authRef = {
    get: jest.fn(() => Promise.resolve(authSnap)),
    update: jest.fn(() => Promise.resolve()),
  };
  const collection = {
    doc: jest.fn(() => authRef),
  };
  const db = {
    collection: jest.fn(() => collection),
  };

  it("should return error, if failed to get service/auth.", async () => {
    // Prepare
    authRef.get.mockImplementationOnce(() =>
      Promise.resolve({ exists: false }),
    );

    // Execute
    const result = await refreshThreadsAccessToken(db);

    // Verify
    expect(result).toEqual({
      err: "Not found: service/auth",
    });
    expect(db.collection.mock.calls).toEqual([["service"]]);
    expect(collection.doc.mock.calls).toEqual([["auth"]]);
    expect(authRef.get.mock.calls).toEqual([[]]);
    expect(axios.get).not.toHaveBeenCalled();
    expect(authRef.update).not.toHaveBeenCalled();
  });

  it("should return error, if service/auth is already deleted.", async () => {
    // Prepare
    authSnap.get.mockImplementationOnce(() => new Date());

    // Execute
    const result = await refreshThreadsAccessToken(db);

    // Verify
    expect(result).toEqual({
      err: "Deleted: service/auth",
    });
    expect(db.collection.mock.calls).toEqual([["service"]]);
    expect(collection.doc.mock.calls).toEqual([["auth"]]);
    expect(authRef.get.mock.calls).toEqual([[]]);
    expect(axios.get).not.toHaveBeenCalled();
    expect(authRef.update).not.toHaveBeenCalled();
  });

  it("should return error, if failed to get service/auth/threads.", async () => {
    // Prepare
    authSnap.get
      .mockImplementationOnce(() => null)
      .mockImplementationOnce(() => undefined);

    // Execute
    const result = await refreshThreadsAccessToken(db);

    // Verify
    expect(result).toEqual({
      err: "Not found: service/auth/threads",
    });
    expect(db.collection.mock.calls).toEqual([["service"]]);
    expect(collection.doc.mock.calls).toEqual([["auth"]]);
    expect(authRef.get.mock.calls).toEqual([[]]);
    expect(axios.get).not.toHaveBeenCalled();
    expect(authRef.update).not.toHaveBeenCalled();
  });

  it("should return error, if service/auth/threads is already deleted.", async () => {
    // Prepare
    authSnap.get
      .mockImplementationOnce(() => null)
      .mockImplementationOnce(() => ({ deletedAt: new Date() }));

    // Execute
    const result = await refreshThreadsAccessToken(db);

    // Verify
    expect(result).toEqual({
      err: "Deleted: service/auth/threads",
    });
    expect(db.collection.mock.calls).toEqual([["service"]]);
    expect(collection.doc.mock.calls).toEqual([["auth"]]);
    expect(authRef.get.mock.calls).toEqual([[]]);
    expect(axios.get).not.toHaveBeenCalled();
    expect(authRef.update).not.toHaveBeenCalled();
  });

  it("should skip the refresh, if no access token is set.", async () => {
    // Prepare
    authSnap.get
      .mockImplementationOnce(() => null)
      .mockImplementationOnce(() => ({
        accessToken: "",
        expiredAt: Timestamp.fromMillis(
          new Date().getTime() - 1000 * 60 * 60 * 24 - 1000,
        ),
      }));

    // Execute
    const result = await refreshThreadsAccessToken(db);

    // Verify
    expect(result).toEqual({
      err: undefined,
    });
    expect(db.collection.mock.calls).toEqual([["service"]]);
    expect(collection.doc.mock.calls).toEqual([["auth"]]);
    expect(authRef.get.mock.calls).toEqual([[]]);
    expect(axios.get).not.toHaveBeenCalled();
    expect(authRef.update).not.toHaveBeenCalled();
  });

  it("should skip the refresh," + " if no expiration is set.", async () => {
    // Prepare
    authSnap.get
      .mockImplementationOnce(() => null)
      .mockImplementationOnce(() => ({
        accessToken: "threads-access-token",
        expiredAt: null,
      }));

    // Execute
    const result = await refreshThreadsAccessToken(db);

    // Verify
    expect(result).toEqual({
      err: undefined,
    });
    expect(db.collection.mock.calls).toEqual([["service"]]);
    expect(collection.doc.mock.calls).toEqual([["auth"]]);
    expect(authRef.get.mock.calls).toEqual([[]]);
    expect(axios.get).not.toHaveBeenCalled();
    expect(authRef.update).not.toHaveBeenCalled();
  });

  it(
    "should skip the refresh," +
      " if there is more than a day until expiration.",
    async () => {
      // Prepare
      authSnap.get
        .mockImplementationOnce(() => null)
        .mockImplementationOnce(() => ({
          accessToken: "threads-access-token",
          expiredAt: Timestamp.fromMillis(
            new Date().getTime() - 1000 * 60 * 60 * 24 - 1000,
          ),
        }));

      // Execute
      const result = await refreshThreadsAccessToken(db);

      // Verify
      expect(result).toEqual({
        err: undefined,
      });
      expect(db.collection.mock.calls).toEqual([["service"]]);
      expect(collection.doc.mock.calls).toEqual([["auth"]]);
      expect(authRef.get.mock.calls).toEqual([[]]);
      expect(axios.get).not.toHaveBeenCalled();
      expect(authRef.update).not.toHaveBeenCalled();
    },
  );

  it("should refresh the access token.", async () => {
    // Prepare
    authSnap.get
      .mockImplementationOnce(() => null)
      .mockImplementationOnce(() => ({
        accessToken: "threads-access-token",
        expiredAt: Timestamp.fromMillis(
          new Date().getTime() - 1000 * 60 * 60 * 24 + 1000,
        ),
      }));
    axios.get.mockImplementationOnce(() =>
      Promise.resolve({
        status: 200,
        data: {
          access_token: "new-access-token",
          expiredIn: 3600,
        },
      }),
    );

    // Execute
    const result = await refreshThreadsAccessToken(db);

    // Verify
    expect(result).toEqual({
      err: undefined,
    });
    expect(db.collection.mock.calls).toEqual([["service"]]);
    expect(collection.doc.mock.calls).toEqual([["auth"]]);
    expect(authRef.get.mock.calls).toEqual([[]]);
    expect(axios.get.mock.calls).toEqual([
      [
        "https://https://graph.threads.net/refresh_access_token" +
          "?grant_type=th_refresh_token" +
          "&access_token=threads-access-token",
      ],
    ]);
    expect(authRef.update.mock.calls).toEqual([
      [
        {
          "threads.accessToken": "new-access-token",
          "threads.expiredAt": expect.any(Date),
        },
      ],
    ]);
  });

  it("should return error, if axios.get not returns status 200.", async () => {
    // Prepare
    authSnap.get
      .mockImplementationOnce(() => null)
      .mockImplementationOnce(() => ({
        accessToken: "threads-access-token",
        expiredAt: Timestamp.fromMillis(
          new Date().getTime() - 1000 * 60 * 60 * 24 + 1000,
        ),
      }));
    axios.get.mockImplementationOnce(() =>
      Promise.resolve({
        status: 500,
        statusText: "Server error",
      }),
    );

    // Execute
    const result = await refreshThreadsAccessToken(db);

    // Verify
    expect(result).toEqual({
      err: "Failed to refresh Threads access token: 500 Server error",
    });
    expect(db.collection.mock.calls).toEqual([["service"]]);
    expect(collection.doc.mock.calls).toEqual([["auth"]]);
    expect(authRef.get.mock.calls).toEqual([[]]);
    expect(axios.get.mock.calls).toEqual([
      [
        "https://https://graph.threads.net/refresh_access_token" +
          "?grant_type=th_refresh_token" +
          "&access_token=threads-access-token",
      ],
    ]);
    expect(authRef.update).not.toHaveBeenCalled();
  });

  it("should return error, if axios.get raises an exception.", async () => {
    // Prepare
    authSnap.get
      .mockImplementationOnce(() => null)
      .mockImplementationOnce(() => ({
        accessToken: "threads-access-token",
        expiredAt: Timestamp.fromMillis(
          new Date().getTime() - 1000 * 60 * 60 * 24 + 1000,
        ),
      }));
    axios.get.mockImplementationOnce(() => Promise.reject("error"));

    // Execute
    const result = await refreshThreadsAccessToken(db);

    // Verify
    expect(result).toEqual({
      err: "error",
    });
    expect(db.collection.mock.calls).toEqual([["service"]]);
    expect(collection.doc.mock.calls).toEqual([["auth"]]);
    expect(authRef.get.mock.calls).toEqual([[]]);
    expect(axios.get.mock.calls).toEqual([
      [
        "https://https://graph.threads.net/refresh_access_token" +
          "?grant_type=th_refresh_token" +
          "&access_token=threads-access-token",
      ],
    ]);
    expect(authRef.update).not.toHaveBeenCalled();
  });
});
