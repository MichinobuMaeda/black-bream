const { describe, it, expect, afterEach } = require("@jest/globals");
const axios = require("axios");

const {
  getQueueName,
  createPosts,
  deletePosts,
  post,
  checkCompleted,
} = require("./post.js");

jest.mock("firebase-functions/logger");
jest.mock("axios");

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

    // Evaluate
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

    // Evaluate
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

    // Evaluate
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

    // Evaluate
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

    // Evaluate
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

    // Evaluate
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

    // Evaluate
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
    data: () => postData,
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

    // Evaluate
    expect(result).toEqual({
      err: "Not found: posts/post-id",
      data: undefined,
    });
    expect(db.collection.mock.calls).toEqual([["posts"]]);
    expect(collection.doc.mock.calls).toEqual([["post-id"]]);
    expect(postRef.get.mock.calls).toEqual([[]]);
    expect(postRef.update.mock.calls).toEqual([]);
    expect(authRef.get.mock.calls).toEqual([]);
    expect(authSnap.get.mock.calls).toEqual([]);
    expect(axios.post.mock.calls).toEqual([]);
  });

  it("should return error, if post is already deleted.", async () => {
    // Prepare
    collection.doc.mockImplementationOnce(() => postRef);
    postSnap.get.mockImplementationOnce(() => new Date());

    // Execute
    const result = await post(db, { id: "post-id", target: "target1" });

    // Evaluate
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
    expect(authRef.get.mock.calls).toEqual([]);
    expect(authSnap.get.mock.calls).toEqual([]);
    expect(axios.post.mock.calls).toEqual([]);
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

    // Evaluate
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
    expect(authSnap.get.mock.calls).toEqual([]);
    expect(axios.post.mock.calls).toEqual([]);
  });

  it("should return error, if auth doc is already deleted.", async () => {
    // Prepare
    collection.doc
      .mockImplementationOnce(() => postRef)
      .mockImplementationOnce(() => authRef);
    authSnap.get.mockImplementationOnce(() => new Date());

    // Execute
    const result = await post(db, { id: "post-id", target: "mastodon" });

    // Evaluate
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
    expect(axios.post.mock.calls).toEqual([]);
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

    // Evaluate
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
    expect(authRef.get.mock.calls).toEqual([]);
    expect(authSnap.get.mock.calls).toEqual([]);
    expect(axios.post.mock.calls).toEqual([]);
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

    // Evaluate
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
    expect(authRef.get.mock.calls).toEqual([]);
    expect(authSnap.get.mock.calls).toEqual([]);
    expect(axios.post.mock.calls).toEqual([]);
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

    // Evaluate
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
    expect(axios.post.mock.calls).toEqual([]);
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

    // Evaluate
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
    expect(axios.post.mock.calls).toEqual([]);
  });

  it("should post.", async () => {
    // Prepare
    collection.doc
      .mockImplementationOnce(() => postRef)
      .mockImplementationOnce(() => authRef);
    axios.post.mockImplementationOnce(() => Promise.resolve({ status: 200 }));

    // Execute
    const result = await post(db, { id: "post-id", target: "mastodon" });

    // Evaluate
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
          sensitive: false,
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

  it("should return error, if axis.post raises exception.", async () => {
    // Prepare
    collection.doc
      .mockImplementationOnce(() => postRef)
      .mockImplementationOnce(() => authRef);
    axios.post.mockImplementationOnce(() => Promise.reject("error"));

    // Execute
    const result = await post(db, { id: "post-id", target: "mastodon" });

    // Evaluate
    expect(result).toEqual({ err: "error", data: undefined });
    expect(db.collection.mock.calls).toEqual([["posts"], ["service"]]);
    expect(collection.doc.mock.calls).toEqual([["post-id"], ["auth"]]);
    expect(postRef.get.mock.calls).toEqual([[]]);
    expect(postRef.update.mock.calls).toEqual([
      [
        {
          status: "posting",
          "targets.mastodon": {
            status: "failed",
            err: "error",
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
          sensitive: false,
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

  it("should return error, if axis.post returns error status.", async () => {
    // Prepare
    collection.doc
      .mockImplementationOnce(() => postRef)
      .mockImplementationOnce(() => authRef);
    axios.post.mockImplementationOnce(() =>
      Promise.resolve({ status: 500, statusText: "Server error" }),
    );

    // Execute
    const result = await post(db, { id: "post-id", target: "mastodon" });

    // Evaluate
    expect(result).toEqual({
      err: "Failed: mastodon 500 Server error",
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
            err: "Failed: mastodon 500 Server error",
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
          sensitive: false,
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

  it("should return error, if target is not supported.", async () => {
    // Prepare
    collection.doc
      .mockImplementationOnce(() => postRef)
      .mockImplementationOnce(() => authRef);

    // Execute
    const result = await post(db, { id: "post-id", target: "dummy" });

    // Evaluate
    expect(result).toEqual({
      err: "Not supported target: dummy",
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
            err: "Not supported target: dummy",
            updatedAt: expect.any(Date),
          },
          updatedAt: expect.any(Date),
        },
      ],
    ]);
    expect(authRef.get.mock.calls).toEqual([[]]);
    expect(authSnap.get.mock.calls).toEqual([["deletedAt"], ["dummy"]]);
    expect(axios.post.mock.calls).toEqual([]);
  });
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

    // Evaluate
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

    // Evaluate
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

    // Evaluate
    expect(result).toEqual({ err: undefined, data: "posting" });
    expect(doc.ref.update.mock.calls).toEqual([]);
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

    // Evaluate
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
