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
    expect(result).toEqual({ data: agent });
    expect(BskyAgent.prototype.login.mock.calls).toEqual([
      [{ identifier, password }],
    ]);
  });

  it("should return error, if Bluesky.login raises an exception.", async () => {
    // Prepare
    const err = new Error("test error");
    BskyAgent.prototype.login.mockRejectedValueOnce(err);

    // Execute
    const result = await bluesky.login(agent, identifier, password);

    // Verify
    expect(result).toEqual({ err });
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
    getMediaAsBlob.mockResolvedValueOnce({ data: blob });
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
    const err = new Error("test error");
    getMediaAsBlob.mockResolvedValueOnce({ err });

    // Execute
    const result = await bluesky.uploadImage(agent, id, text, file);

    // Verify
    expect(getMediaAsBlob.mock.calls).toEqual([[bucket, "upload-id", "1.jpg"]]);
    expect(BskyAgent.prototype.uploadBlob).not.toHaveBeenCalled();
    expect(result).toEqual({ err });
  });

  it("should return error, if Bluesky.uploadBlob raises an exception.", async () => {
    // Prepare
    getMediaAsBlob.mockResolvedValueOnce({ data: blob });
    getMimeTypes.mockImplementationOnce(() => "image/jpeg");
    const err = new Error("test error");
    BskyAgent.prototype.uploadBlob.mockRejectedValueOnce(err);

    // Execute
    const result = await bluesky.uploadImage(agent, id, text, file);

    // Verify
    expect(getMediaAsBlob.mock.calls).toEqual([[bucket, "upload-id", "1.jpg"]]);
    expect(BskyAgent.prototype.uploadBlob.mock.calls).toEqual([
      [blob, { encoding: "image/jpeg" }],
    ]);
    expect(result).toEqual({ err });
  });
});

describe("uploadThumb", () => {
  it("should upload thumb image to Bluesky.", async () => {
    // Prepare
    httpRequest.mockResolvedValueOnce({
      data: { status: 200, bytes: () => Promise.resolve(new Uint8Array(10)) },
    });
    reduceImageSize.mockResolvedValueOnce({ data: new Uint8Array(10) });
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
    const err = new Error("404 not found");
    httpRequest.mockResolvedValueOnce({ err });

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
      data: { status: 200, bytes: () => Promise.resolve(new Uint8Array(10)) },
    });
    const err = new Error("test error");
    reduceImageSize.mockResolvedValueOnce({ err });

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
      data: { status: 200, bytes: () => Promise.resolve(new Uint8Array(10)) },
    });
    reduceImageSize.mockResolvedValueOnce({ data: new Uint8Array(10) });
    const err = new Error("test error");
    BskyAgent.prototype.uploadBlob.mockRejectedValueOnce(err);
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

  it("should return error, if generateLinkCard returns error.", async () => {
    // Prepare
    generateLinkCard.mockResolvedValueOnce({ err: new Error("test error") });
    mockUploadThumb.mockResolvedValueOnce({ data: new Uint8Array(10) });

    // Execute
    const result = await bluesky.generateExternal(agent, text);

    // Verify
    expect(generateLinkCard.mock.calls).toEqual([["Text"]]);
    expect(mockUploadThumb).not.toHaveBeenCalled();
    expect(result).toEqual({ err: new Error("test error") });
  });

  it("should not generate external without card.", async () => {
    // Prepare
    generateLinkCard.mockResolvedValueOnce({ data: null });

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
    expect(result).toEqual({});
  });

  it("should return error, if Bluesky.post raises an exception.", async () => {
    // Prepare
    const err = new Error("test error");
    BskyAgent.prototype.post.mockRejectedValueOnce(err);

    // Execute
    const result = await bluesky.requestPost(agent, text, embed);

    // Verify
    expect(BskyAgent.prototype.post.mock.calls).toEqual([
      [{ text, langs, embed }],
    ]);
    expect(result).toEqual({ err });
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
    const err = new Error("test error");
    mockGetParams.mockResolvedValueOnce({ err });

    // Execute
    const result = await bluesky.post(id, { text, files: [file] });

    // Verify
    expect(mockGetParams.mock.calls).toEqual([[]]);
    expect(mockLogin).not.toHaveBeenCalled();
    expect(mockUploadImage).not.toHaveBeenCalled();
    expect(mockGenerateExternal).not.toHaveBeenCalled();
    expect(mockRequestPost).not.toHaveBeenCalled();
    expect(result).toEqual({ err });
  });

  it("should post with an image.", async () => {
    // Prepare
    const agent = { test: "agent" };
    mockLogin.mockResolvedValueOnce({ data: agent });
    mockUploadImage.mockResolvedValueOnce({ data: image });
    mockRequestPost.mockResolvedValueOnce({});

    // Execute
    const result = await bluesky.post(id, { text, files: [file] });

    // Verify
    expect(mockLogin.mock.calls).toEqual([
      [expect.any(Object), identifier, password],
    ]);
    expect(mockUploadImage.mock.calls).toEqual([[agent, id, text, file]]);
    expect(mockGenerateExternal).not.toHaveBeenCalled();
    expect(mockRequestPost.mock.calls).toEqual([
      [
        agent,
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
    expect(result).toEqual({});
  });

  it("should post with an external link.", async () => {
    // Prepare
    const agent = { test: "agent" };
    mockLogin.mockResolvedValueOnce({ data: agent });
    mockGenerateExternal.mockResolvedValueOnce({
      data: {
        uri: "https://example.com",
        title: "Title",
        description: "Description",
      },
    });
    mockRequestPost.mockResolvedValueOnce({});

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
        agent,
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
    expect(result).toEqual({});
  });

  it("should return error, if login returns err.", async () => {
    // Prepare
    const err = new Error("test error");
    mockLogin.mockResolvedValueOnce({ err });

    // Execute
    const result = await bluesky.post(id, { text, files: [file] });

    // Verify
    expect(mockLogin.mock.calls).toEqual([
      [expect.any(Object), identifier, password],
    ]);
    expect(mockUploadImage).not.toHaveBeenCalled();
    expect(mockGenerateExternal).not.toHaveBeenCalled();
    expect(mockRequestPost).not.toHaveBeenCalled();
    expect(result).toEqual({ err });
  });

  it("should return error, if uploadImage returns err.", async () => {
    // Prepare
    const agent = { test: "agent" };
    mockLogin.mockResolvedValueOnce({ data: agent });
    const err = new Error("test error");
    mockUploadImage.mockResolvedValueOnce({ err });

    // Execute
    const result = await bluesky.post(id, { text, files: [file] });

    // Verify
    expect(mockLogin.mock.calls).toEqual([
      [expect.any(Object), identifier, password],
    ]);
    expect(mockUploadImage.mock.calls).toEqual([[agent, id, text, file]]);
    expect(mockGenerateExternal).not.toHaveBeenCalled();
    expect(mockRequestPost).not.toHaveBeenCalled();
    expect(result).toEqual({ err });
  });

  it("should post without embed, if generateExternal returns empty.", async () => {
    // Prepare
    const agent = { test: "agent" };
    mockLogin.mockResolvedValueOnce({ data: agent });
    mockGenerateExternal.mockResolvedValueOnce({ data: undefined });
    mockRequestPost.mockResolvedValueOnce({});

    // Execute
    const result = await bluesky.post(id, { text, files: [] });

    // Verify
    expect(mockLogin.mock.calls).toEqual([
      [expect.any(Object), identifier, password],
    ]);
    expect(mockUploadImage).not.toHaveBeenCalled();
    expect(mockGenerateExternal).toHaveBeenCalled();
    expect(mockRequestPost.mock.calls).toEqual([[agent, text, undefined]]);
    expect(result).toEqual({});
  });

  it("should return error, if requestPost returns err.", async () => {
    // Prepare
    const agent = { test: "agent" };
    mockLogin.mockResolvedValueOnce({ data: agent });
    mockGenerateExternal.mockResolvedValueOnce({
      data: {
        uri: "https://example.com",
        title: "Title",
        description: "Description",
      },
    });
    const err = new Error("test error");
    mockRequestPost.mockResolvedValueOnce({ err });

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
        agent,
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
    expect(result).toEqual({ err });
  });
});
