import { describe, it, expect, afterEach, vi } from "vitest";
import { BskyAgent } from "@atproto/api";
import {
  generateLinkCard,
  reduceImageSize,
  getMediaAsBlob,
  httpRequest,
  getMimeTypes,
} from "./utils.js";
import { Bluesky } from "./bluesky.js";

vi.mock("firebase-functions/logger");
vi.mock("@atproto/api");
BskyAgent.prototype.login = vi.fn(() => Promise.resolve({}));
BskyAgent.prototype.post = vi.fn(() => Promise.resolve());
BskyAgent.prototype.uploadBlob = vi.fn(() =>
  Promise.resolve({ data: { blob: new Uint8Array(10) } }),
);
vi.mock("./utils.js");

const db = {};
const contents = [new ArrayBuffer(8)];
const fileRef = { download: vi.fn(() => Promise.resolve(contents)) };
const bucket = { file: vi.fn(() => fileRef) };
const bluesky = new Bluesky(db, bucket);

const thumbUrl = "https://example.com/thumb.jpg";
const service = "https://bluesky.example.com";
const identifier = "bluesky-identifier";
const password = "bluesky-password";
const params = { service, identifier, password };
const agent = new BskyAgent(service);

FormData.prototype.append = vi.fn();

afterEach(() => {
  vi.clearAllMocks();
});

describe("login", () => {
  it("should login to Bluesky.", async () => {
    // Prepare
    BskyAgent.prototype.login.mockResolvedValueOnce({});

    // Execute
    const result = await bluesky.login(agent, identifier, password);

    // Verify
    expect(result).toEqual({ err: undefined });
    expect(BskyAgent.prototype.login.mock.calls).toEqual([
      [{ identifier, password }],
    ]);
  });

  it("should return error, if Bluesky.login raises an exception.", async () => {
    // Prepare
    BskyAgent.prototype.login.mockRejectedValueOnce("error");

    // Execute
    const result = await bluesky.login(agent, identifier, password);

    // Verify
    expect(result).toEqual({ err: "error" });
    expect(BskyAgent.prototype.login.mock.calls).toEqual([
      [{ identifier, password }],
    ]);
  });
});

describe("uploadImage", () => {
  const id = "upload-id";
  const text = "Text";
  const file = "1.jpg";
  const blob = new Blob(contents, { type: "image/jpeg" });

  it("should upload image to Bluesky.", async () => {
    // Prepare
    getMediaAsBlob.mockResolvedValueOnce({ err: undefined, data: blob });
    getMimeTypes.mockImplementationOnce(() => "image/jpeg");

    // Execute
    const result = await bluesky.uploadImage(agent, id, text, file);

    // Verify
    expect(getMediaAsBlob.mock.calls).toEqual([[bucket, "upload-id", "1.jpg"]]);
    expect(BskyAgent.prototype.uploadBlob.mock.calls).toEqual([
      [blob, { encoding: "image/jpeg" }],
    ]);
    expect(result).toEqual({ data: new Uint8Array(10) });
  });

  it("should return error, if getMediaAsBlob returns err.", async () => {
    // Prepare
    getMediaAsBlob.mockResolvedValueOnce({ err: "error", data: undefined });

    // Execute
    const result = await bluesky.uploadImage(agent, id, text, file);

    // Verify
    expect(getMediaAsBlob.mock.calls).toEqual([[bucket, "upload-id", "1.jpg"]]);
    expect(BskyAgent.prototype.uploadBlob).not.toHaveBeenCalled();
    expect(result).toEqual({ err: "error" });
  });

  it("should return error, if Bluesky.uploadBlob raises an exception.", async () => {
    // Prepare
    getMediaAsBlob.mockResolvedValueOnce({ err: undefined, data: blob });
    getMimeTypes.mockImplementationOnce(() => "image/jpeg");
    BskyAgent.prototype.uploadBlob.mockRejectedValueOnce("error");

    // Execute
    const result = await bluesky.uploadImage(agent, id, text, file);

    // Verify
    expect(getMediaAsBlob.mock.calls).toEqual([[bucket, "upload-id", "1.jpg"]]);
    expect(BskyAgent.prototype.uploadBlob.mock.calls).toEqual([
      [blob, { encoding: "image/jpeg" }],
    ]);
    expect(result).toEqual({ err: "error" });
  });
});

describe("uploadThumb", () => {
  it("should upload thumb image to Bluesky.", async () => {
    // Prepare
    httpRequest.mockResolvedValueOnce({
      data: { status: 200, bytes: () => new Uint8Array(10) },
    });
    reduceImageSize.mockResolvedValueOnce({
      err: undefined,
      data: new Uint8Array(10),
    });
    BskyAgent.prototype.uploadBlob.mockResolvedValueOnce({
      data: { blob: new Uint8Array(10) },
    });
    getMimeTypes.mockImplementationOnce(() => "image/jpeg");

    // Execute
    const result = await bluesky.uploadThumb(agent, thumbUrl);

    // Verify
    expect(httpRequest.mock.calls).toEqual([[thumbUrl]]);
    expect(reduceImageSize.mock.calls).toEqual([[new Uint8Array(10)]]);
    expect(BskyAgent.prototype.uploadBlob.mock.calls).toEqual([
      [new Uint8Array(10), { encoding: "image/jpeg" }],
    ]);
    expect(result).toEqual({ data: new Uint8Array(10) });
  });

  it("should return error, if httpRequest returns err.", async () => {
    // Prepare
    httpRequest.mockResolvedValueOnce({ err: "404 not found" });

    // Execute
    const result = await bluesky.uploadThumb(agent, thumbUrl);

    // Verify
    expect(httpRequest.mock.calls).toEqual([[thumbUrl]]);
    expect(reduceImageSize).not.toHaveBeenCalled();
    expect(BskyAgent.prototype.uploadBlob).not.toHaveBeenCalled();
    expect(result).toEqual({});
  });

  it("should return error, if reduceImageSize returns err.", async () => {
    // Prepare
    httpRequest.mockResolvedValueOnce({
      data: { status: 200, bytes: () => new Uint8Array(10) },
    });
    reduceImageSize.mockResolvedValueOnce({ err: "error", data: undefined });

    // Execute
    const result = await bluesky.uploadThumb(agent, thumbUrl);

    // Verify
    expect(httpRequest.mock.calls).toEqual([[thumbUrl]]);
    expect(reduceImageSize.mock.calls).toEqual([[new Uint8Array(10)]]);
    expect(BskyAgent.prototype.uploadBlob).not.toHaveBeenCalled();
    expect(result).toEqual({});
  });

  it("should return error, if Bluesky.uploadBlob raises an exception.", async () => {
    // Prepare
    httpRequest.mockResolvedValueOnce({
      data: { status: 200, bytes: () => new Uint8Array(10) },
    });
    reduceImageSize.mockResolvedValueOnce({
      err: undefined,
      data: new Uint8Array(10),
    });
    BskyAgent.prototype.uploadBlob.mockRejectedValueOnce("error");
    getMimeTypes.mockImplementationOnce(() => "image/jpeg");

    // Execute
    const result = await bluesky.uploadThumb(agent, thumbUrl);

    // Verify
    expect(httpRequest.mock.calls).toEqual([[thumbUrl]]);
    expect(reduceImageSize.mock.calls).toEqual([[new Uint8Array(10)]]);
    expect(BskyAgent.prototype.uploadBlob.mock.calls).toEqual([
      [new Uint8Array(10), { encoding: "image/jpeg" }],
    ]);
    expect(result).toEqual({});
  });
});

describe("generateExternal", () => {
  const text = "Text";
  const mockUploadThumb = vi.spyOn(bluesky, "uploadThumb");

  it("should not generate external without card.", async () => {
    // Prepare
    generateLinkCard.mockResolvedValueOnce({ err: undefined, data: null });

    // Execute
    const result = await bluesky.generateExternal(agent, text);

    // Verify
    expect(generateLinkCard.mock.calls).toEqual([["Text"]]);
    expect(bluesky.uploadThumb).not.toHaveBeenCalled();
    expect(result).toEqual({ data: undefined });
  });

  it("should generate external.", async () => {
    // Prepare
    generateLinkCard.mockResolvedValueOnce({
      err: undefined,
      data: {
        uri: "https://example.com",
        title: "Title",
        description: "Description",
        thumbUrl,
      },
    });
    mockUploadThumb.mockResolvedValueOnce({ data: new Uint8Array(10) });

    // Execute
    const result = await bluesky.generateExternal(agent, text);

    // Verify
    expect(generateLinkCard.mock.calls).toEqual([["Text"]]);
    expect(bluesky.uploadThumb.mock.calls).toEqual([
      [agent, "https://example.com/thumb.jpg"],
    ]);
    expect(result).toEqual({
      data: {
        uri: "https://example.com",
        title: "Title",
        description: "Description",
        thumb: new Uint8Array(10),
      },
    });
  });

  it("should generate external without thumb.", async () => {
    // Prepare
    generateLinkCard.mockResolvedValueOnce({
      err: undefined,
      data: {
        uri: "https://example.com",
        title: "Title",
        description: "Description",
        thumbUrl: null,
      },
    });

    // Execute
    const result = await bluesky.generateExternal(agent, text);

    // Verify
    expect(generateLinkCard.mock.calls).toEqual([["Text"]]);
    expect(bluesky.uploadThumb).not.toHaveBeenCalled();
    expect(result).toEqual({
      data: {
        uri: "https://example.com",
        title: "Title",
        description: "Description",
      },
    });
  });
});

describe("requestPost", () => {
  const langs = ["ja"];
  const text = "Text";
  const embed = { uri: "https://example.com" };

  it("should request post.", async () => {
    // Prepare
    BskyAgent.prototype.post.mockResolvedValueOnce({ data: {} });

    // Execute
    const result = await bluesky.requestPost(agent, text, embed);

    // Verify
    expect(BskyAgent.prototype.post.mock.calls).toEqual([
      [{ text, langs, embed }],
    ]);
    expect(result).toEqual({ err: undefined });
  });

  it("should return error, if Bluesky.post raises an exception.", async () => {
    // Prepare
    BskyAgent.prototype.post.mockRejectedValueOnce("error");

    // Execute
    const result = await bluesky.requestPost(agent, text, embed);

    // Verify
    expect(BskyAgent.prototype.post.mock.calls).toEqual([
      [{ text, langs, embed }],
    ]);
    expect(result).toEqual({ err: "error" });
  });
});

describe("post", () => {
  const id = "upload-id";
  const text = "Text";
  const file = "1.jpg";
  const langs = ["ja"];
  const image = new Uint8Array(10);

  const mockLogin = vi.spyOn(bluesky, "login");
  const mockUploadImage = vi.spyOn(bluesky, "uploadImage");
  const mockGenerateExternal = vi.spyOn(bluesky, "generateExternal");
  const mockRequestPost = vi.spyOn(bluesky, "requestPost");

  const mockGetParams = vi.spyOn(bluesky, "getParams");
  mockGetParams.mockResolvedValue({ data: params });

  it("should return error. if getParams returns error.", async () => {
    // Prepare
    mockGetParams.mockResolvedValueOnce({ err: "error" });

    // Execute
    const result = await bluesky.post(id, { text, files: [file] });

    // Verify
    expect(mockGetParams.mock.calls).toEqual([[]]);
    expect(mockLogin).not.toHaveBeenCalled();
    expect(mockUploadImage).not.toHaveBeenCalled();
    expect(mockGenerateExternal).not.toHaveBeenCalled();
    expect(mockRequestPost).not.toHaveBeenCalled();
    expect(result).toEqual({ err: "error" });
  });

  it("should post with an image.", async () => {
    // Prepare

    mockLogin.mockResolvedValueOnce({});
    mockUploadImage.mockResolvedValueOnce({ data: image });
    mockRequestPost.mockResolvedValueOnce({ err: undefined });

    // Execute
    const result = await bluesky.post(id, { text, files: [file] });

    // Verify
    expect(mockLogin.mock.calls).toEqual([
      [expect.any(Object), identifier, password],
    ]);
    expect(mockUploadImage.mock.calls).toEqual([
      [expect.any(Object), id, text, file],
    ]);
    expect(mockGenerateExternal).not.toHaveBeenCalled();
    expect(mockRequestPost.mock.calls).toEqual([
      [
        expect.any(Object),
        text,
        {
          $type: "app.bsky.embed.images",
          images: [
            {
              alt: text.substring(0, 100),
              image,
            },
          ],
        },
      ],
    ]);
    expect(result).toEqual({ err: undefined });
  });

  it("should post with an external link.", async () => {
    // Prepare
    mockLogin.mockResolvedValueOnce({});
    mockGenerateExternal.mockResolvedValueOnce({
      data: {
        uri: "https://example.com",
        title: "Title",
        description: "Description",
      },
    });
    mockRequestPost.mockResolvedValueOnce({ err: undefined });

    // Execute
    const result = await bluesky.post(id, { text, files: [] });

    // Verify
    expect(mockLogin.mock.calls).toEqual([
      [expect.any(Object), identifier, password],
    ]);
    expect(mockUploadImage).not.toHaveBeenCalled();
    expect(mockGenerateExternal).toHaveBeenCalled();
    expect(mockRequestPost.mock.calls).toEqual([
      [
        expect.any(Object),
        text,
        {
          $type: "app.bsky.embed.external",
          external: {
            uri: "https://example.com",
            title: "Title",
            description: "Description",
          },
        },
      ],
    ]);
    expect(result).toEqual({ err: undefined });
  });

  it("should return error, if login returns err.", async () => {
    // Prepare
    mockLogin.mockResolvedValueOnce({ err: "error" });

    // Execute
    const result = await bluesky.post(id, { text, files: [file] });

    // Verify
    expect(mockLogin.mock.calls).toEqual([
      [expect.any(Object), identifier, password],
    ]);
    expect(mockUploadImage).not.toHaveBeenCalled();
    expect(mockGenerateExternal).not.toHaveBeenCalled();
    expect(mockRequestPost).not.toHaveBeenCalled();
    expect(result).toEqual({ err: "error" });
  });

  it("should return error, if uploadImage returns err.", async () => {
    // Prepare
    mockLogin.mockResolvedValueOnce({});
    mockUploadImage.mockResolvedValueOnce({ err: "error" });

    // Execute
    const result = await bluesky.post(id, { text, files: [file] });

    // Verify
    expect(mockLogin.mock.calls).toEqual([
      [expect.any(Object), identifier, password],
    ]);
    expect(mockUploadImage.mock.calls).toEqual([
      [expect.any(Object), id, text, file],
    ]);
    expect(mockGenerateExternal).not.toHaveBeenCalled();
    expect(mockRequestPost).not.toHaveBeenCalled();
    expect(result).toEqual({ err: "error" });
  });

  it("should post without embed, if generateExternal returns empty.", async () => {
    // Prepare
    mockLogin.mockResolvedValueOnce({});
    mockGenerateExternal.mockResolvedValueOnce({ data: undefined });
    mockRequestPost.mockResolvedValueOnce({ err: undefined });

    // Execute
    const result = await bluesky.post(id, { text, files: [] });

    // Verify
    expect(mockLogin.mock.calls).toEqual([
      [expect.any(Object), identifier, password],
    ]);
    expect(mockUploadImage).not.toHaveBeenCalled();
    expect(mockGenerateExternal).toHaveBeenCalled();
    expect(mockRequestPost.mock.calls).toEqual([
      [expect.any(Object), text, undefined],
    ]);
    expect(result).toEqual({ err: undefined });
  });

  it("should return error, if requestPost returns err.", async () => {
    // Prepare
    mockLogin.mockResolvedValueOnce({});
    mockGenerateExternal.mockResolvedValueOnce({
      data: {
        uri: "https://example.com",
        title: "Title",
        description: "Description",
      },
    });
    mockRequestPost.mockResolvedValueOnce({ err: "error" });

    // Execute
    const result = await bluesky.post(id, { text, files: [] });

    // Verify
    expect(mockLogin.mock.calls).toEqual([
      [expect.any(Object), identifier, password],
    ]);
    expect(mockUploadImage).not.toHaveBeenCalled();
    expect(mockGenerateExternal).toHaveBeenCalled();
    expect(mockRequestPost.mock.calls).toEqual([
      [
        expect.any(Object),
        text,
        {
          $type: "app.bsky.embed.external",
          external: {
            uri: "https://example.com",
            title: "Title",
            description: "Description",
          },
        },
      ],
    ]);
    expect(result).toEqual({ err: "error" });
  });
});
