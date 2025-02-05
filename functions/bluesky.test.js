const { describe, it, expect, afterEach } = require("@jest/globals");
const axios = require("axios");
const { BskyAgent } = require("@atproto/api");

let { generateLinkCard, getMediaAsUint8Array } = require("./utils.js");
const { post } = require("./bluesky.js");

jest.mock("firebase-functions/logger");
jest.mock("axios");
jest.mock("@atproto/api");
BskyAgent.prototype.login = jest.fn(() => Promise.resolve());
BskyAgent.prototype.post = jest.fn(() => Promise.resolve());
BskyAgent.prototype.uploadBlob = jest.fn(() =>
  Promise.resolve({ data: { blob: new Uint8Array(10) } }),
);
jest.mock("./utils.js");

FormData.prototype.append = jest.fn();

afterEach(() => {
  jest.clearAllMocks();
});

describe("post", () => {
  const contents = [new Uint8Array(8)];
  const fileRef = { download: jest.fn(() => Promise.resolve(contents[0])) };
  const bucket = { file: jest.fn(() => fileRef) };
  const params = {
    service: "https://bluesky.example.com",
    identifier: "bluesky-identifier",
    password: "bluesky-password",
  };
  const id = "post-id";
  const dataText = { text: "Text" };
  const dataLink = { text: "Text https://example.com" };
  const dataImage = {
    text: "Text",
    files: ["1.jpg"],
  };

  it("should post to Bluesky.", async () => {
    // Prepare
    generateLinkCard.mockImplementationOnce(() => ({
      err: undefined,
      data: null,
    }));

    // Execute
    const result = await post(bucket, params, id, dataText);

    // Verify
    expect(result).toEqual({ err: undefined });
    expect(getMediaAsUint8Array).not.toHaveBeenCalled();
    expect(generateLinkCard.mock.calls).toEqual([["Text"]]);
    expect(BskyAgent.prototype.login.mock.calls).toEqual([
      [{ identifier: "bluesky-identifier", password: "bluesky-password" }],
    ]);
    expect(BskyAgent.prototype.post.mock.calls).toEqual([
      [{ text: "Text", langs: ["ja"] }],
    ]);
  });

  it("should post with image to Bluesky.", async () => {
    // Prepare
    getMediaAsUint8Array.mockImplementationOnce(() =>
      Promise.resolve({ err: undefined, data: contents }),
    );

    // Execute
    const result = await post(bucket, params, id, dataImage);

    // Verify
    expect(result).toEqual({ err: undefined });
    expect(getMediaAsUint8Array.mock.calls).toEqual([
      [bucket, "post-id", "1.jpg"],
    ]);
    expect(generateLinkCard).not.toHaveBeenCalled();
    expect(BskyAgent.prototype.login.mock.calls).toEqual([
      [{ identifier: "bluesky-identifier", password: "bluesky-password" }],
    ]);
    expect(BskyAgent.prototype.post.mock.calls).toEqual([
      [
        {
          text: "Text",
          langs: ["ja"],
          embed: {
            $type: "app.bsky.embed.images",
            images: [
              {
                alt: dataImage.text.substring(0, 100),
                image: new Uint8Array(10),
              },
            ],
          },
        },
      ],
    ]);
  });

  it("should return error, if getMediaAsUint8Array returns err.", async () => {
    // Prepare
    getMediaAsUint8Array.mockImplementationOnce(() =>
      Promise.resolve({ err: "error", data: undefined }),
    );

    // Execute
    const result = await post(bucket, params, id, dataImage);

    // Verify
    expect(result).toEqual({ err: "error", data: undefined });
    expect(getMediaAsUint8Array.mock.calls).toEqual([
      [bucket, "post-id", "1.jpg"],
    ]);
    expect(generateLinkCard).not.toHaveBeenCalled();
    expect(BskyAgent.prototype.login.mock.calls).toEqual([
      [{ identifier: "bluesky-identifier", password: "bluesky-password" }],
    ]);
    expect(BskyAgent.prototype.post).not.toHaveBeenCalled();
  });

  it("should post to Bluesky with an link card, if text includes url. #1", async () => {
    // Prepare
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
    const result = await post(bucket, params, id, dataLink);

    // Verify
    expect(result).toEqual({ err: undefined });
    expect(getMediaAsUint8Array).not.toHaveBeenCalled();
    expect(generateLinkCard.mock.calls).toEqual([["Text https://example.com"]]);
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
    const result = await post(bucket, params, id, dataLink);

    // Verify
    expect(result).toEqual({ err: undefined });
    expect(getMediaAsUint8Array).not.toHaveBeenCalled();
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
    const result = await post(bucket, params, id, dataLink);

    // Verify
    expect(result).toEqual({ err: undefined });
    expect(getMediaAsUint8Array).not.toHaveBeenCalled();
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
      generateLinkCard.mockImplementationOnce(() =>
        Promise.resolve({ err: undefined, data: null }),
      );
      BskyAgent.prototype.post.mockImplementationOnce(() =>
        Promise.reject("error"),
      );

      // Execute
      const result = await post(bucket, params, id, dataText);

      // Verify
      expect(result).toEqual({ err: "error" });
      expect(getMediaAsUint8Array).not.toHaveBeenCalled();
      expect(BskyAgent.prototype.login.mock.calls).toEqual([
        [{ identifier: "bluesky-identifier", password: "bluesky-password" }],
      ]);
      expect(BskyAgent.prototype.post.mock.calls).toEqual([
        [{ text: "Text", langs: ["ja"] }],
      ]);
    },
  );
});
