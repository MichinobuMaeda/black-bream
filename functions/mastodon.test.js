const { describe, it, expect, afterEach } = require("@jest/globals");
const axios = require("axios");

const { post } = require("./mastodon.js");

jest.mock("firebase-functions/logger");
jest.mock("axios");

FormData.prototype.append = jest.fn();

afterEach(() => {
  process.env.IMAGE_UPLOAD_TIMEOUT = undefined;
  jest.clearAllMocks();
});

describe("post", () => {
  const image = new Uint8Array(10);
  const fileRef = { download: jest.fn(() => Promise.resolve(image)) };
  const bucket = { file: jest.fn(() => fileRef) };
  const params = {
    url: "https://mastodon.example.com",
    token: "mastodon-token",
  };
  const id = "post-id";
  const dataText = { text: "Text" };
  const dataImage = {
    text: "Text",
    files: ["image.jpeg"],
  };

  it("should post to Mastodon.", async () => {
    // Prepare
    axios.post.mockImplementationOnce(() => Promise.resolve({ status: 200 }));

    // Execute
    const result = await post(bucket, params, id, dataText);

    // Verify
    expect(result).toEqual({ err: undefined });
    expect(bucket.file).not.toHaveBeenCalled();
    expect(FormData.prototype.append.mock.calls).toEqual([
      ["status", "Text"],
      ["sensitive", "false"],
      ["visibility", "public"],
      ["language", "ja"],
    ]);
    expect(axios.get).not.toHaveBeenCalled();
    expect(axios.post.mock.calls).toEqual([
      [
        `${params.url}/v1/statuses`,
        expect.any(FormData),
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${params.token}`,
            "Idempotency-Key": expect.any(String),
          },
        },
      ],
    ]);
  });

  it("should post with image to Mastodon.", async () => {
    // Prepare
    axios.post
      .mockImplementationOnce(() =>
        Promise.resolve({ status: 200, data: { id: "media-id" } }),
      )
      .mockImplementationOnce(() => Promise.resolve({ status: 200 }));

    // Execute
    const result = await post(bucket, params, id, dataImage);

    // Verify
    expect(result).toEqual({ err: undefined });
    expect(bucket.file.mock.calls).toEqual([
      ["public/posts/post-id/image.jpeg"],
    ]);
    expect(FormData.prototype.append.mock.calls).toEqual([
      ["file", image],
      ["status", "Text"],
      ["sensitive", "false"],
      ["visibility", "public"],
      ["language", "ja"],
      ["media_ids", "media-id"],
    ]);
    expect(axios.get).not.toHaveBeenCalled();
    expect(axios.post.mock.calls).toEqual([
      [
        `${params.url}/v2/media`,
        expect.any(FormData),
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${params.token}`,
          },
        },
      ],
      [
        `${params.url}/v1/statuses`,
        expect.any(FormData),
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${params.token}`,
            "Idempotency-Key": expect.any(String),
          },
        },
      ],
    ]);
  });

  it("should wait to upload image and post with image to Mastodon.", async () => {
    // Prepare
    process.env.IMAGE_UPLOAD_TIMEOUT = 1.1;
    axios.post
      .mockImplementationOnce(() =>
        Promise.resolve({ status: 202, data: { id: "media-id" } }),
      )
      .mockImplementationOnce(() => Promise.resolve({ status: 200 }));
    axios.get.mockImplementationOnce(() => Promise.resolve({ status: 200 }));

    // Execute
    const result = await post(bucket, params, id, dataImage);

    // Verify
    expect(result).toEqual({ err: undefined });
    expect(bucket.file.mock.calls).toEqual([
      ["public/posts/post-id/image.jpeg"],
    ]);
    expect(FormData.prototype.append.mock.calls).toEqual([
      ["file", image],
      ["status", "Text"],
      ["sensitive", "false"],
      ["visibility", "public"],
      ["language", "ja"],
      ["media_ids", "media-id"],
    ]);
    expect(axios.get.mock.calls).toEqual([
      [
        `${params.url}/v1/media/media-id`,
        {
          headers: {
            Authorization: `Bearer ${params.token}`,
          },
        },
      ],
    ]);
    expect(axios.post.mock.calls).toEqual([
      [
        `${params.url}/v2/media`,
        expect.any(FormData),
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${params.token}`,
          },
        },
      ],
      [
        `${params.url}/v1/statuses`,
        expect.any(FormData),
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${params.token}`,
            "Idempotency-Key": expect.any(String),
          },
        },
      ],
    ]);
  });

  it("should wait twice to upload image and post with image to Mastodon.", async () => {
    // Prepare
    process.env.IMAGE_UPLOAD_TIMEOUT = 1.1;
    axios.post
      .mockImplementationOnce(() =>
        Promise.resolve({ status: 202, data: { id: "media-id" } }),
      )
      .mockImplementationOnce(() => Promise.resolve({ status: 200 }));
    axios.get.mockImplementationOnce(() => Promise.resolve({ status: 206 }));

    // Execute
    const result = await post(bucket, params, id, dataImage);

    // Verify
    expect(result).toEqual({ err: undefined });
    expect(bucket.file.mock.calls).toEqual([
      ["public/posts/post-id/image.jpeg"],
    ]);
    expect(FormData.prototype.append.mock.calls).toEqual([
      ["file", image],
      ["status", "Text"],
      ["sensitive", "false"],
      ["visibility", "public"],
      ["language", "ja"],
      ["media_ids", "media-id"],
    ]);
    expect(axios.get.mock.calls).toEqual([
      [
        `${params.url}/v1/media/media-id`,
        {
          headers: {
            Authorization: `Bearer ${params.token}`,
          },
        },
      ],
    ]);
    expect(axios.post.mock.calls).toEqual([
      [
        `${params.url}/v2/media`,
        expect.any(FormData),
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${params.token}`,
          },
        },
      ],
      [
        `${params.url}/v1/statuses`,
        expect.any(FormData),
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${params.token}`,
            "Idempotency-Key": expect.any(String),
          },
        },
      ],
    ]);
  });

  it("should return error, if failed to upload image. #1", async () => {
    // Prepare
    axios.post.mockImplementationOnce(() =>
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
    expect(bucket.file.mock.calls).toEqual([
      ["public/posts/post-id/image.jpeg"],
    ]);
    expect(FormData.prototype.append.mock.calls).toEqual([["file", image]]);
    expect(axios.get).not.toHaveBeenCalled();
    expect(axios.post.mock.calls).toEqual([
      [
        `${params.url}/v2/media`,
        expect.any(FormData),
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${params.token}`,
          },
        },
      ],
    ]);
  });

  it("should return error, if failed to upload image. #2", async () => {
    // Prepare
    axios.post.mockImplementationOnce(() =>
      Promise.resolve({ status: 202, data: { id: "media-id" } }),
    );
    axios.get.mockImplementationOnce(() =>
      Promise.resolve({ status: 500, statusText: "Server error" }),
    );

    // Execute
    const result = await post(bucket, params, id, dataImage);

    // Verify
    expect(result).toEqual({ err: "500 Server error" });
    expect(bucket.file.mock.calls).toEqual([
      ["public/posts/post-id/image.jpeg"],
    ]);
    expect(FormData.prototype.append.mock.calls).toEqual([["file", image]]);
    expect(axios.get.mock.calls).toEqual([
      [
        `${params.url}/v1/media/media-id`,
        {
          headers: {
            Authorization: `Bearer ${params.token}`,
          },
        },
      ],
    ]);
    expect(axios.post.mock.calls).toEqual([
      [
        `${params.url}/v2/media`,
        expect.any(FormData),
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${params.token}`,
          },
        },
      ],
    ]);
  });

  it("should return error, if axis.post raises an exception for Mastodon.", async () => {
    // Prepare
    axios.post.mockImplementationOnce(() => Promise.reject("error"));

    // Execute
    const result = await post(bucket, params, id, dataText);

    // Verify
    expect(result).toEqual({ err: "error" });
    expect(FormData.prototype.append.mock.calls).toEqual([
      ["status", "Text"],
      ["sensitive", "false"],
      ["visibility", "public"],
      ["language", "ja"],
    ]);
    expect(axios.post.mock.calls).toEqual([
      [
        `${params.url}/v1/statuses`,
        expect.any(FormData),
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${params.token}`,
            "Idempotency-Key": expect.any(String),
          },
        },
      ],
    ]);
  });

  it("should return error, if axis.post returns error status for Mastodon.", async () => {
    // Prepare
    axios.post.mockImplementationOnce(() =>
      Promise.resolve({ status: 500, statusText: "Server error" }),
    );

    // Execute
    const result = await post(bucket, params, id, dataText);

    // Verify
    expect(result).toEqual({ err: "500 Server error" });
    expect(FormData.prototype.append.mock.calls).toEqual([
      ["status", "Text"],
      ["sensitive", "false"],
      ["visibility", "public"],
      ["language", "ja"],
    ]);
    expect(axios.post.mock.calls).toEqual([
      [
        `${params.url}/v1/statuses`,
        expect.any(FormData),
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${params.token}`,
            "Idempotency-Key": expect.any(String),
          },
        },
      ],
    ]);
  });
});
