const { describe, it, expect, afterEach } = require("@jest/globals");
const { getMediaAsBlob, httpRequest } = require("./utils.js");

const { Misskey } = require("./misskey.js");

jest.mock("firebase-functions/logger");
jest.mock("./utils.js");

FormData.prototype.append = jest.fn();

const url = "https://misskey.example.com";
const token = "misskey-token";
const params = { url, token };

const db = {};
const contents = [new ArrayBuffer(8)];
const fileRef = { download: jest.fn(() => Promise.resolve(contents)) };
const bucket = { file: jest.fn(() => fileRef) };
const misskey = new Misskey(db, bucket);

afterEach(() => {
  process.env.IMAGE_UPLOAD_TIMEOUT = undefined;
  jest.clearAllMocks();
});

describe("Misskey object", () => {
  it("should have property id === 'misskey'.", () => {
    expect(misskey.id).toEqual("misskey");
  });
});

describe("getMediaList", () => {
  const id = "post-id";
  const files = ["1.jpg"];
  const blob = new Blob([new Uint8Array(1024)], { type: "image/jpeg" });

  it("should return empty media list for empty files.", async () => {
    // Execute
    const result = await misskey.getMediaList(url, token, id, []);

    // Verify
    expect(result).toEqual({ err: undefined, data: [] });
  });

  it("should return empty media list for undefined files.", async () => {
    // Execute
    const result = await misskey.getMediaList(url, token, id, undefined);

    // Verify
    expect(result).toEqual({ err: undefined, data: [] });
  });

  it("should return error, if failed to get media as blob.", async () => {
    // Prepare
    getMediaAsBlob.mockResolvedValueOnce({ err: "500 Server error" });

    // Execute
    const result = await misskey.getMediaList(url, token, id, files);

    // Verify
    expect(result).toEqual({ err: "500 Server error" });
  });

  it("should return media list.", async () => {
    // Prepare
    getMediaAsBlob.mockImplementation(() =>
      Promise.resolve({
        err: undefined,
        data: blob,
      }),
    );
    httpRequest.mockResolvedValueOnce({
      data: {
        status: 200,
        json: () => Promise.resolve({ id: "media-id" }),
      },
    });
    FormData.prototype.append = jest.fn();

    // Execute
    const result = await misskey.getMediaList(url, token, id, files);

    // Verify
    expect(httpRequest.mock.calls).toEqual([
      [
        `${url}/drive/files/create`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: expect.any(FormData),
        },
      ],
    ]);
    expect(FormData.prototype.append.mock.calls).toEqual([
      ["file", blob, "1.jpg"],
      ["name", "1.jpg"],
      ["isSensitive", false],
    ]);
    expect(result).toEqual({ err: undefined, data: ["media-id"] });
  });

  it("should return error, if httpRequest returns error.", async () => {
    // Prepare
    getMediaAsBlob.mockResolvedValueOnce({
      err: undefined,
      data: blob,
    });
    httpRequest.mockImplementation(() => Promise.resolve({ err: "error" }));
    FormData.prototype.append = jest.fn();

    // Execute
    const result = await misskey.getMediaList(url, token, id, files);

    // Verify
    expect(httpRequest.mock.calls).toEqual([
      [
        `${url}/drive/files/create`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: expect.any(FormData),
        },
      ],
    ]);
    expect(FormData.prototype.append.mock.calls).toEqual([
      ["file", blob, "1.jpg"],
      ["name", "1.jpg"],
      ["isSensitive", false],
    ]);
    expect(result).toEqual({ err: "error" });
  });
});

describe("post", () => {
  const blob = new Blob([new Uint8Array(1024)], { type: "image/jpeg" });
  const id = "post-id";
  const dataText = { text: "Text" };
  const dataImage = {
    text: "Text",
    files: ["1.jpg"],
  };

  const mockGetParams = jest.spyOn(misskey, "getParams");
  mockGetParams.mockResolvedValue({ data: params });

  it("should return error, if getParams returns error.", async () => {
    // Prepare
    mockGetParams.mockResolvedValueOnce({ err: "error" });

    // Execute
    const result = await misskey.post(id, dataText);

    // Verify
    expect(result).toEqual({ err: "error" });
  });

  it("should post to Misskey.", async () => {
    // Prepare
    const mockGetMediaList = jest.spyOn(misskey, "getMediaList");
    mockGetMediaList.mockResolvedValueOnce({ err: undefined, data: [] });
    httpRequest.mockResolvedValueOnce({ data: { status: 200 } });

    // Execute
    const result = await misskey.post(id, dataText);

    // Verify
    expect(mockGetMediaList.mock.calls).toEqual([[url, token, id, undefined]]);
    expect(httpRequest.mock.calls).toEqual([
      [
        `${url}/notes/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            visibility: "public",
            text: "Text",
          }),
        },
      ],
    ]);
    expect(result).toEqual({ err: undefined });
  });

  it("should post with image to Misskey.", async () => {
    // Prepare
    const mockGetMediaList = jest.spyOn(misskey, "getMediaList");
    mockGetMediaList.mockResolvedValueOnce({
      err: undefined,
      data: ["media-id"],
    });
    httpRequest.mockResolvedValueOnce({ data: { status: 200 } });

    // Execute
    const result = await misskey.post(id, dataImage);

    // Verify
    expect(mockGetMediaList.mock.calls).toEqual([
      [url, token, id, dataImage.files],
    ]);
    expect(httpRequest.mock.calls).toEqual([
      [
        `${url}/notes/create`,

        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            visibility: "public",
            text: "Text",
            mediaIds: ["media-id"],
          }),
        },
      ],
    ]);
    expect(result).toEqual({ err: undefined });
  });

  it("should return error, if failed to get image ids.", async () => {
    // Prepare
    const mockGetMediaList = jest.spyOn(misskey, "getMediaList");
    mockGetMediaList.mockResolvedValueOnce({ err: "500 Server error" });

    // Execute
    const result = await misskey.post(id, dataImage);

    // Verify
    expect(httpRequest).not.toHaveBeenCalled();
    expect(result).toEqual({ err: "500 Server error" });
  });

  it("should return error, if fetch raises an exception for Misskey.", async () => {
    // Prepare
    const mockGetMediaList = jest.spyOn(misskey, "getMediaList");
    mockGetMediaList.mockResolvedValueOnce({ data: [] });
    httpRequest.mockResolvedValueOnce({ err: "error" });

    // Execute
    const result = await misskey.post(id, dataText);

    // Verify
    expect(mockGetMediaList.mock.calls).toEqual([[url, token, id, undefined]]);
    expect(httpRequest.mock.calls).toEqual([
      [
        `${url}/notes/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            visibility: "public",
            text: "Text",
          }),
        },
      ],
    ]);
    expect(result).toEqual({ err: "error" });
  });
});
