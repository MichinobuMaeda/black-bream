const { describe, it, expect, afterEach } = require("@jest/globals");
const { getMediaAsBlob } = require("./utils.js");

const { post } = require("./mastodon.js");
const { bool } = require("sharp");

jest.mock("firebase-functions/logger");
jest.mock("./utils.js");
global.fetch = jest.fn();

FormData.prototype.append = jest.fn();

afterEach(() => {
  process.env.IMAGE_UPLOAD_TIMEOUT = undefined;
  jest.clearAllMocks();
});

describe("post", () => {
  const buffer = new ArrayBuffer(1024);
  const blob = new Blob([new Uint8Array(buffer)], { type: "image/jpeg" });
  const fileRef = { download: jest.fn(() => Promise.resolve([buffer])) };
  const bucket = { file: jest.fn(() => fileRef) };
  const params = {
    url: "https://mastodon.example.com",
    token: "mastodon-token",
  };
  const id = "post-id";
  const dataText = { text: "Text" };
  const dataImage = {
    text: "Text",
    files: ["1.jpg"],
  };
  getMediaAsBlob.mockImplementation(() =>
    Promise.resolve({
      err: undefined,
      data: blob,
    }),
  );

  it("should post to Mastodon.", async () => {
    // Prepare
    global.fetch.mockImplementationOnce(() => Promise.resolve({ status: 200 }));

    // Execute
    const result = await post(bucket, params, id, dataText);

    // Verify
    expect(result).toEqual({ err: undefined });
    expect(getMediaAsBlob).not.toHaveBeenCalled();
    expect(FormData.prototype.append).not.toHaveBeenCalled();
    expect(global.fetch.mock.calls).toEqual([
      [
        `${params.url}/v1/statuses`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${params.token}`,
            "Idempotency-Key": expect.any(String),
          },
          body: JSON.stringify({
            status: "Text",
            sensitive: false,
            visibility: "public",
            language: "ja",
          }),
        },
      ],
    ]);
  });

  it("should post with image to Mastodon.", async () => {
    // Prepare
    global.fetch
      .mockImplementationOnce(() =>
        Promise.resolve({ status: 200, data: { id: "media-id" } }),
      )
      .mockImplementationOnce(() => Promise.resolve({ status: 200 }));

    // Execute
    const result = await post(bucket, params, id, dataImage);

    // Verify
    expect(result).toEqual({ err: undefined });
    expect(getMediaAsBlob.mock.calls).toEqual([[bucket, id, "1.jpg"]]);
    expect(FormData.prototype.append.mock.calls).toEqual([
      ["file", blob, "1.jpg"],
    ]);
    expect(global.fetch.mock.calls).toEqual([
      [
        `${params.url}/v2/media`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${params.token}`,
          },
          body: expect.any(FormData),
        },
      ],
      [
        `${params.url}/v1/statuses`,

        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${params.token}`,
            "Idempotency-Key": expect.any(String),
          },
          body: JSON.stringify({
            status: "Text",
            sensitive: false,
            visibility: "public",
            language: "ja",
            media_ids: ["media-id"],
          }),
        },
      ],
    ]);
  });

  it("should wait to upload image and post with image to Mastodon.", async () => {
    // Prepare
    process.env.IMAGE_UPLOAD_TIMEOUT = 1.1;
    global.fetch
      .mockImplementationOnce(() =>
        Promise.resolve({ status: 202, data: { id: "media-id" } }),
      )
      .mockImplementationOnce(() => Promise.resolve({ status: 200 }))
      .mockImplementationOnce(() => Promise.resolve({ status: 200 }));

    // Execute
    const result = await post(bucket, params, id, dataImage);

    // Verify
    expect(result).toEqual({ err: undefined });
    expect(getMediaAsBlob.mock.calls).toEqual([[bucket, id, "1.jpg"]]);
    expect(FormData.prototype.append.mock.calls).toEqual([
      ["file", blob, "1.jpg"],
    ]);
    expect(global.fetch.mock.calls).toEqual([
      [
        `${params.url}/v2/media`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${params.token}`,
          },
          body: expect.any(FormData),
        },
      ],
      [
        `${params.url}/v1/media/media-id`,
        {
          headers: {
            Authorization: `Bearer ${params.token}`,
          },
        },
      ],
      [
        `${params.url}/v1/statuses`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${params.token}`,
            "Idempotency-Key": expect.any(String),
          },
          body: JSON.stringify({
            status: "Text",
            sensitive: false,
            visibility: "public",
            language: "ja",
            media_ids: ["media-id"],
          }),
        },
      ],
    ]);
  });

  it("should wait twice to upload image and post with image to Mastodon.", async () => {
    // Prepare
    process.env.IMAGE_UPLOAD_TIMEOUT = 1.1;
    global.fetch
      .mockImplementationOnce(() =>
        Promise.resolve({ status: 202, data: { id: "media-id" } }),
      )
      .mockImplementationOnce(() => Promise.resolve({ status: 206 }))
      .mockImplementationOnce(() => Promise.resolve({ status: 200 }));

    // Execute
    const result = await post(bucket, params, id, dataImage);

    // Verify
    expect(result).toEqual({ err: undefined });
    expect(getMediaAsBlob.mock.calls).toEqual([[bucket, id, "1.jpg"]]);
    expect(FormData.prototype.append.mock.calls).toEqual([
      ["file", blob, "1.jpg"],
    ]);
    expect(global.fetch.mock.calls).toEqual([
      [
        `${params.url}/v2/media`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${params.token}`,
          },
          body: expect.any(FormData),
        },
      ],
      [
        `${params.url}/v1/media/media-id`,
        {
          headers: {
            Authorization: `Bearer ${params.token}`,
          },
        },
      ],
      [
        `${params.url}/v1/statuses`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${params.token}`,
            "Idempotency-Key": expect.any(String),
          },
          body: JSON.stringify({
            status: "Text",
            sensitive: false,
            visibility: "public",
            language: "ja",
            media_ids: ["media-id"],
          }),
        },
      ],
    ]);
  });

  it("should return error, if failed to upload image. #1", async () => {
    // Prepare
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        status: 500,
        statusText: "Server error",
        data: { id: "media-id" },
      }),
    );

    // Execute
    const result = await post(bucket, params, id, dataImage);

    // Verify
    expect(result).toEqual({ err: "500 Server error" });
    expect(FormData.prototype.append.mock.calls).toEqual([
      ["file", blob, "1.jpg"],
    ]);
    expect(global.fetch.mock.calls).toEqual([
      [
        `${params.url}/v2/media`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${params.token}`,
          },
          body: expect.any(FormData),
        },
      ],
    ]);
  });

  it("should return error, if failed to upload image. #2", async () => {
    // Prepare
    global.fetch
      .mockImplementationOnce(() =>
        Promise.resolve({ status: 202, data: { id: "media-id" } }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({ status: 500, statusText: "Server error" }),
      );

    // Execute
    const result = await post(bucket, params, id, dataImage);

    // Verify
    expect(result).toEqual({ err: "500 Server error" });
    expect(getMediaAsBlob.mock.calls).toEqual([[bucket, id, "1.jpg"]]);
    expect(FormData.prototype.append.mock.calls).toEqual([
      ["file", blob, "1.jpg"],
    ]);
    expect(global.fetch.mock.calls).toEqual([
      [
        `${params.url}/v2/media`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${params.token}`,
          },
          body: expect.any(FormData),
        },
      ],
      [
        `${params.url}/v1/media/media-id`,
        {
          headers: {
            Authorization: `Bearer ${params.token}`,
          },
        },
      ],
    ]);
  });

  it("should return error, if axis.post raises an exception for Mastodon.", async () => {
    // Prepare
    global.fetch.mockImplementationOnce(() => Promise.reject("error"));

    // Execute
    const result = await post(bucket, params, id, dataText);

    // Verify
    expect(result).toEqual({ err: "error" });
    expect(getMediaAsBlob).not.toHaveBeenCalled();
    expect(FormData.prototype.append).not.toHaveBeenCalled();
    expect(global.fetch.mock.calls).toEqual([
      [
        `${params.url}/v1/statuses`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${params.token}`,
            "Idempotency-Key": expect.any(String),
          },
          body: JSON.stringify({
            status: "Text",
            sensitive: false,
            visibility: "public",
            language: "ja",
          }),
        },
      ],
    ]);
  });

  it("should return error, if axis.post returns error status for Mastodon.", async () => {
    // Prepare
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({ status: 500, statusText: "Server error" }),
    );

    // Execute
    const result = await post(bucket, params, id, dataText);

    // Verify
    expect(result).toEqual({ err: "500 Server error" });
    expect(FormData.prototype.append).not.toHaveBeenCalled();
    expect(global.fetch.mock.calls).toEqual([
      [
        `${params.url}/v1/statuses`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${params.token}`,
            "Idempotency-Key": expect.any(String),
          },
          body: JSON.stringify({
            status: "Text",
            sensitive: false,
            visibility: "public",
            language: "ja",
          }),
        },
      ],
    ]);
  });
});
