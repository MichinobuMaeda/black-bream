const { describe, it, expect, afterEach } = require("@jest/globals");
const { Timestamp } = require("firebase-admin/firestore");
const storage = require("firebase-admin/storage");
const axios = require("axios");

const { post, refreshThreadsAccessToken } = require("./threads.js");

jest.mock("firebase-functions/logger");
jest.mock("firebase-admin/storage");
jest.mock("axios");

storage.getDownloadURL = jest.fn(() => Promise.resolve("download-url"));

afterEach(() => {
  jest.clearAllMocks();
});

describe("post", () => {
  const fileRef = { data: "file-ref" };
  const bucket = { file: jest.fn(() => fileRef) };
  const params = {
    userId: "threads-userId",
    accessToken: "threads-accessToken",
  };
  const id = "post-id";
  const dataText = { text: "Text" };
  const dataImage = { text: "Text", files: ["image.jpeg"] };

  it("should post to Threads.", async () => {
    // Prepare
    axios.post
      .mockImplementationOnce(() =>
        Promise.resolve({ status: 200, data: { id: "01234566789" } }),
      )
      .mockImplementationOnce(() => Promise.resolve({ status: 200 }));

    // Execute
    const result = await post(bucket, params, id, dataText);

    // Verify
    expect(result).toEqual({ err: undefined });
    expect(bucket.file).not.toHaveBeenCalled();
    expect(axios.post.mock.calls).toEqual([
      [
        `https://graph.threads.net/v1.0/${params.userId}/threads` +
          "?media_type=TEXT" +
          `&text=${encodeURIComponent("Text")}` +
          `&access_token=${params.accessToken}`,
      ],
      [
        `https://graph.threads.net/v1.0/${params.userId}/threads_publish` +
          "?creation_id=01234566789" +
          `&access_token=${params.accessToken}`,
      ],
    ]);
  });

  it("should post with image to Threads.", async () => {
    // Prepare
    axios.post
      .mockImplementationOnce(() =>
        Promise.resolve({ status: 200, data: { id: "01234566789" } }),
      )
      .mockImplementationOnce(() => Promise.resolve({ status: 200 }));

    // Execute
    const result = await post(bucket, params, id, dataImage);

    // Verify
    expect(result).toEqual({ err: undefined });
    expect(bucket.file.mock.calls).toEqual([[dataImage.files[0]]]);
    expect(axios.post.mock.calls).toEqual([
      [
        `https://graph.threads.net/v1.0/${params.userId}/threads` +
          "?media_type=IMAGE" +
          `&text=${encodeURIComponent("Text")}` +
          `&image_urls=${encodeURIComponent("download-url")}` +
          `&access_token=${params.accessToken}`,
      ],
      [
        `https://graph.threads.net/v1.0/${params.userId}/threads_publish` +
          "?creation_id=01234566789" +
          `&access_token=${params.accessToken}`,
      ],
    ]);
  });

  it("should return error, if axis.post raises an exception for Threads.", async () => {
    // Prepare
    axios.post.mockImplementationOnce(() => Promise.reject("error"));

    // Execute
    const result = await post(bucket, params, id, dataText);

    // Verify
    expect(result).toEqual({ err: "error" });
    expect(axios.post.mock.calls).toEqual([
      [
        `https://graph.threads.net/v1.0/${params.userId}/threads` +
          "?media_type=TEXT" +
          `&text=${encodeURIComponent("Text")}` +
          `&access_token=${params.accessToken}`,
      ],
    ]);
  });

  it("should return error, if axis.post returns error status for Threads.", async () => {
    // Prepare
    axios.post.mockImplementationOnce(() =>
      Promise.resolve({ status: 500, statusText: "Server error" }),
    );

    // Execute
    const result = await post(bucket, params, id, dataText);

    // Verify
    expect(result).toEqual({
      err: "Failed to create container: 500 Server error",
    });
    expect(axios.post.mock.calls).toEqual([
      [
        `https://graph.threads.net/v1.0/${params.userId}/threads` +
          "?media_type=TEXT" +
          `&text=${encodeURIComponent("Text")}` +
          `&access_token=${params.accessToken}`,
      ],
    ]);
  });

  it("should return error, if axis.post returns error status for Threads #2.", async () => {
    // Prepare
    axios.post
      .mockImplementationOnce(() =>
        Promise.resolve({ status: 200, data: { id: "01234566789" } }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({ status: 500, statusText: "Server error" }),
      );

    // Execute
    const result = await post(bucket, params, id, dataText);

    // Verify
    expect(result).toEqual({ err: "Failed to publish: 500 Server error" });
    expect(axios.post.mock.calls).toEqual([
      [
        `https://graph.threads.net/v1.0/${params.userId}/threads` +
          "?media_type=TEXT" +
          `&text=${encodeURIComponent("Text")}` +
          `&access_token=${params.accessToken}`,
      ],
      [
        `https://graph.threads.net/v1.0/${params.userId}/threads_publish` +
          "?creation_id=01234566789" +
          `&access_token=${params.accessToken}`,
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
    expect(result).toEqual({ err: "Not found: service/auth" });
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
    expect(result).toEqual({ err: "Deleted: service/auth" });
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
    expect(result).toEqual({ err: "Not found: service/auth/threads" });
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
    expect(result).toEqual({ err: "Deleted: service/auth/threads" });
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
    expect(result).toEqual({ err: undefined });
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
    expect(result).toEqual({ err: undefined });
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
      expect(result).toEqual({ err: undefined });
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
    expect(result).toEqual({ err: undefined });
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
    expect(result).toEqual({ err: "error" });
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
