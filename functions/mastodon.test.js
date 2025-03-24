const {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} = require("@jest/globals");
const { getMediaAsBlob, httpRequest, sleep } = require("./utils.js");

const { Mastodon } = require("./mastodon.js");

jest.mock("firebase-functions/logger");
jest.mock("./utils.js");

FormData.prototype.append = jest.fn();

const url = "https://mastodon.example.com";
const token = "mastodon-token";
const params = { url, token };

const db = {};
const bucket = { file: jest.fn() };
const mastodon = new Mastodon(db, bucket);

const orgTimeout = process.env.IMAGE_UPLOAD_TIMEOUT;

beforeEach(() => {
  process.env.IMAGE_UPLOAD_TIMEOUT = "2";
});

afterEach(() => {
  jest.clearAllMocks();
  process.env.IMAGE_UPLOAD_TIMEOUT = orgTimeout;
});

describe("Mastodon object", () => {
  it("should have property id === 'mastodon'.", () => {
    expect(mastodon.id).toEqual("mastodon");
  });
});

describe("waitMediaUpload", () => {
  const medias = ["media-id"];

  it("should wait default timeout * 1000 for media upload.", async () => {
    // Prepare
    process.env.IMAGE_UPLOAD_TIMEOUT = undefined;
    httpRequest.mockResolvedValueOnce({ data: { status: 200 } });

    // Execute
    const result = await mastodon.waitMediaUpload(url, token, medias);

    // Verify
    expect(httpRequest.mock.calls).toEqual([
      [
        `${url}/v1/media/media-id`,
        { headers: { Authorization: `Bearer ${token}` } },
      ],
    ]);
    expect(sleep.mock.calls).toEqual([[5]]);
    expect(result).toEqual({ err: undefined });
  });

  it("should wait timeout * 1000 for media upload.", async () => {
    // Prepare
    httpRequest.mockResolvedValueOnce({ data: { status: 200 } });

    // Execute
    const result = await mastodon.waitMediaUpload(url, token, medias);

    // Verify
    expect(httpRequest.mock.calls).toEqual([
      [
        `${url}/v1/media/media-id`,
        { headers: { Authorization: `Bearer ${token}` } },
      ],
    ]);
    expect(sleep.mock.calls).toEqual([[2]]);
    expect(result).toEqual({ err: undefined });
  });

  it("should wait timeout * timeout * 1000 for media upload.", async () => {
    // Prepare
    httpRequest.mockResolvedValueOnce({ data: { status: 206 } });

    // Execute
    const result = await mastodon.waitMediaUpload(url, token, medias);

    // Verify
    expect(httpRequest.mock.calls).toEqual([
      [
        `${url}/v1/media/media-id`,
        { headers: { Authorization: `Bearer ${token}` } },
      ],
    ]);
    expect(sleep.mock.calls).toEqual([[2], [2 * 2]]);
    expect(result).toEqual({ err: undefined });
  });

  it("should return error if get media status failed.", async () => {
    // Prepare
    httpRequest.mockResolvedValueOnce({ err: "get media status failed" });

    // Execute
    const result = await mastodon.waitMediaUpload(url, token, medias);

    // Verify
    expect(httpRequest.mock.calls).toEqual([
      [
        `${url}/v1/media/media-id`,
        { headers: { Authorization: `Bearer ${token}` } },
      ],
    ]);
    expect(sleep.mock.calls).toEqual([[2]]);
    expect(result).toEqual({ err: "get media status failed" });
  });
});

describe("getMediaList", () => {
  const id = "post-id";
  const files = ["file1.png", "file2.png"];
  const blob = { data: "blob" };
  const mediaId = "media-id";
  const medias = [mediaId];

  it("should return empty media list if files is empty.", async () => {
    // Prepare

    // Execute
    const result = await mastodon.getMediaList(url, token, id, []);

    // Verify
    expect(result).toEqual({ data: [] });
  });

  it("should return empty media list if files is undefined.", async () => {
    // Prepare

    // Execute
    const result = await mastodon.getMediaList(url, token, id, undefined);

    // Verify
    expect(result).toEqual({ data: [] });
  });

  it("should return error if getMediaAsBlob failed.", async () => {
    // Prepare
    getMediaAsBlob.mockResolvedValueOnce({ err: "get media as blob failed" });

    // Execute
    const result = await mastodon.getMediaList(url, token, id, files);

    // Verify
    expect(getMediaAsBlob.mock.calls).toEqual([[bucket, id, "file1.png"]]);
    expect(result).toEqual({ err: "get media as blob failed" });
  });

  it("should return error if post media failed.", async () => {
    // Prepare
    getMediaAsBlob.mockResolvedValueOnce(blob);
    httpRequest.mockResolvedValueOnce({ err: "post media failed" });

    // Execute
    const result = await mastodon.getMediaList(url, token, id, files);

    // Verify
    expect(getMediaAsBlob.mock.calls).toEqual([[bucket, id, "file1.png"]]);
    expect(global.FormData.prototype.append.mock.calls).toEqual([
      ["file", "blob", "file1.png"],
    ]);
    expect(httpRequest.mock.calls).toEqual([
      [
        `${url}/v2/media`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: expect.any(FormData),
        },
      ],
    ]);
    expect(result).toEqual({ err: "post media failed" });
  });

  it("should return error if wait media upload failed.", async () => {
    // Prepare
    getMediaAsBlob.mockResolvedValueOnce(blob);
    httpRequest.mockResolvedValueOnce({
      data: {
        status: 202,
        json: () => Promise.resolve({ id: "media-id" }),
      },
    });
    const mockWaitMediaUpload = jest.spyOn(mastodon, "waitMediaUpload");
    mockWaitMediaUpload.mockResolvedValueOnce({
      err: "wait media upload failed",
    });

    // Execute
    const result = await mastodon.getMediaList(url, token, id, files);

    // Verify
    expect(getMediaAsBlob.mock.calls).toEqual([[bucket, id, "file1.png"]]);
    expect(global.FormData.prototype.append.mock.calls).toEqual([
      ["file", "blob", "file1.png"],
    ]);
    expect(httpRequest.mock.calls).toEqual([
      [
        `${url}/v2/media`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: expect.any(FormData),
        },
      ],
    ]);
    expect(mockWaitMediaUpload.mock.calls).toEqual([[url, token, medias]]);
    expect(result).toEqual({ err: "wait media upload failed" });
  });

  it("should return media list with wait.", async () => {
    // Prepare
    getMediaAsBlob.mockResolvedValueOnce(blob);
    httpRequest.mockResolvedValueOnce({
      data: {
        status: 202,
        json: () => Promise.resolve({ id: "media-id" }),
      },
    });
    const mockWaitMediaUpload = jest.spyOn(mastodon, "waitMediaUpload");
    mockWaitMediaUpload.mockResolvedValueOnce({});

    // Execute
    const result = await mastodon.getMediaList(url, token, id, files);

    // Verify
    expect(getMediaAsBlob.mock.calls).toEqual([[bucket, id, "file1.png"]]);
    expect(global.FormData.prototype.append.mock.calls).toEqual([
      ["file", "blob", "file1.png"],
    ]);
    expect(httpRequest.mock.calls).toEqual([
      [
        `${url}/v2/media`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: expect.any(FormData),
        },
      ],
    ]);
    expect(mockWaitMediaUpload.mock.calls).toEqual([[url, token, medias]]);
    expect(result).toEqual({ data: medias });
  });

  it("should return media list without wait.", async () => {
    // Prepare
    getMediaAsBlob.mockResolvedValueOnce(blob);
    httpRequest.mockResolvedValueOnce({
      data: { status: 200, json: () => Promise.resolve({ id: "media-id" }) },
    });

    // Execute
    const result = await mastodon.getMediaList(url, token, id, files);

    // Verify
    expect(getMediaAsBlob.mock.calls).toEqual([[bucket, id, "file1.png"]]);
    expect(global.FormData.prototype.append.mock.calls).toEqual([
      ["file", "blob", "file1.png"],
    ]);
    expect(httpRequest.mock.calls).toEqual([
      [
        `${url}/v2/media`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: expect.any(FormData),
        },
      ],
    ]);
    expect(result).toEqual({ data: medias });
  });
});

describe("generateIdempotencyKey", () => {
  it("should generate idempotency key.", () => {
    // Prepare
    const text = "Text";
    const medias = ["media-id"];

    // Execute
    const result = mastodon.generateIdempotencyKey(text, medias);

    // Verify
    expect(result).toEqual(expect.any(String));
  });
});

describe("requestPost", () => {
  const text = "Text";
  const postRespJson = { id: "post-id" };

  it("should request post with an media.", async () => {
    // Prepare
    httpRequest.mockResolvedValueOnce({ data: postRespJson });

    // Execute
    const result = await mastodon.requestPost(url, token, text, ["media-id"]);

    // Verify
    expect(httpRequest.mock.calls).toEqual([
      [
        `${url}/v1/statuses`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "Idempotency-Key": expect.any(String),
          },
          body: JSON.stringify({
            status: text,
            sensitive: false,
            visibility: "public",
            language: "ja",
            media_ids: ["media-id"],
          }),
        },
      ],
    ]);
    expect(result).toEqual({});
  });

  it("should request post without media.", async () => {
    // Prepare
    httpRequest.mockResolvedValueOnce({ data: postRespJson });

    // Execute
    const result = await mastodon.requestPost(url, token, text, []);

    // Verify
    expect(httpRequest.mock.calls).toEqual([
      [
        `${url}/v1/statuses`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "Idempotency-Key": expect.any(String),
          },
          body: JSON.stringify({
            status: text,
            sensitive: false,
            visibility: "public",
            language: "ja",
          }),
        },
      ],
    ]);
    expect(result).toEqual({});
  });
});

describe("post", () => {
  const id = "post-id";
  const text = "Text";
  const files = ["file1.png", "file2.png"];

  const mockGetParams = jest.spyOn(mastodon, "getParams");
  mockGetParams.mockResolvedValue({ data: params });

  it("should return error if getParams returns error.", async () => {
    // Prepare
    mockGetParams.mockResolvedValueOnce({ err: "Error" });

    // Execute
    const result = await mastodon.post(id, { text, files });

    // Verify
    expect(mockGetParams.mock.calls).toEqual([[]]);
    expect(result).toEqual({ err: "Error" });
  });

  it("should post with media.", async () => {
    // Prepare
    const mockGetMediaList = jest.spyOn(mastodon, "getMediaList");
    const mockRequestPost = jest.spyOn(mastodon, "requestPost");
    mockGetMediaList.mockResolvedValueOnce({ data: ["media-id"] });
    mockRequestPost.mockResolvedValueOnce({});

    // Execute
    const result = await mastodon.post(id, { text, files });

    // Verify
    expect(mockGetMediaList.mock.calls).toEqual([[url, token, id, files]]);
    expect(mockRequestPost.mock.calls).toEqual([
      [url, token, text, ["media-id"]],
    ]);
    expect(result).toEqual({});
  });

  it("should post without media.", async () => {
    // Prepare
    const mockGetMediaList = jest.spyOn(mastodon, "getMediaList");
    const mockRequestPost = jest.spyOn(mastodon, "requestPost");
    mockGetMediaList.mockResolvedValueOnce({ data: [] });
    mockRequestPost.mockResolvedValueOnce({});

    // Execute
    const result = await mastodon.post(id, { text });

    // Verify
    expect(mockGetMediaList.mock.calls).toEqual([[url, token, id, undefined]]);
    expect(mockRequestPost.mock.calls).toEqual([[url, token, text, []]]);
    expect(result).toEqual({});
  });

  it("should return error if getMediaList failed.", async () => {
    // Prepare
    const mockGetMediaList = jest.spyOn(mastodon, "getMediaList");
    const mockRequestPost = jest.spyOn(mastodon, "requestPost");
    mockGetMediaList.mockResolvedValueOnce({ err: "Error" });

    // Execute
    const result = await mastodon.post(id, { text, files });

    // Verify
    expect(mockGetMediaList.mock.calls).toEqual([[url, token, id, files]]);
    expect(mockRequestPost).not.toHaveBeenCalled();
    expect(result).toEqual({ err: "Error" });
  });
});
