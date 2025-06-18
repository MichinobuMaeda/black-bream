import { describe, it, expect, afterEach, vi } from "vitest";
import { getMediaAsBlob, httpRequest, joinLines } from "./utils.js";
import { Misskey } from "./misskey.js";

vi.mock("firebase-functions/logger");
vi.mock("./utils.js");

// restore original implementations for the mocked functions
joinLines.mockImplementation((...lines) =>
  lines
    .map((line) => line?.trim())
    .filter((line) => line)
    .join("\n"),
);

FormData.prototype.append = vi.fn();

const url = "https://misskey.example.com";
const token = "misskey-token";
const params = { url, token };

const db = {};
const contents = [new ArrayBuffer(8)];
const fileRef = { download: vi.fn(() => Promise.resolve(contents)) };
const bucket = { file: vi.fn(() => fileRef) };
const misskey = new Misskey(db, bucket);

afterEach(() => {
  process.env.IMAGE_UPLOAD_TIMEOUT = undefined;
  vi.clearAllMocks();
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
    expect(result).toEqual({ data: [] });
  });

  it("should return empty media list for undefined files.", async () => {
    // Execute
    const result = await misskey.getMediaList(url, token, id, undefined);

    // Verify
    expect(result).toEqual({ data: [] });
  });

  it("should return error, if failed to get media as blob.", async () => {
    // Prepare
    const err = new Error("500 Server error");
    getMediaAsBlob.mockResolvedValueOnce({ err });

    // Execute
    const result = await misskey.getMediaList(url, token, id, files);

    // Verify
    expect(result).toEqual({ err });
  });

  it("should return media list.", async () => {
    // Prepare
    getMediaAsBlob.mockImplementation(() => Promise.resolve({ data: blob }));
    httpRequest.mockResolvedValueOnce({
      data: {
        status: 200,
        json: () => Promise.resolve({ id: "media-id" }),
      },
    });
    FormData.prototype.append = vi.fn();

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
    expect(result).toEqual({ data: ["media-id"] });
  });

  it("should return error, if httpRequest returns error.", async () => {
    // Prepare
    getMediaAsBlob.mockResolvedValueOnce({
      data: blob,
    });
    const err = new Error("500 Server error");
    httpRequest.mockImplementation(() => Promise.resolve({ err }));
    FormData.prototype.append = vi.fn();

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
    expect(result).toEqual({ err });
  });
});

describe("post", () => {
  const blob = new Blob([new Uint8Array(1024)], { type: "image/jpeg" });
  const id = "post-id";
  const dataText = { text: "Text" };
  const dataTitleMessageLink = {
    title: "Title",
    message: "Message",
    link: "https://example.com",
  };
  const dataImage = {
    text: "Text",
    files: ["1.jpg"],
  };

  const mockGetParams = vi.spyOn(misskey, "getParams");
  mockGetParams.mockResolvedValue({ data: params });

  it("should return error, if getParams returns error.", async () => {
    // Prepare
    const err = new Error("test error");
    mockGetParams.mockResolvedValueOnce({ err });

    // Execute
    const result = await misskey.post(id, dataText);

    // Verify
    expect(result).toEqual({ err });
  });

  it("should post to Misskey with text", async () => {
    // Prepare
    const mockGetMediaList = vi.spyOn(misskey, "getMediaList");
    mockGetMediaList.mockResolvedValueOnce({ data: [] });
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
    expect(result).toEqual({});
  });

  it("should post to Misskey with title, message and link.", async () => {
    // Prepare
    const mockGetMediaList = vi.spyOn(misskey, "getMediaList");
    mockGetMediaList.mockResolvedValueOnce({ data: [] });
    httpRequest.mockResolvedValueOnce({ data: { status: 200 } });

    // Execute
    const result = await misskey.post(id, dataTitleMessageLink);

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
            text: "Title\nMessage\nhttps://example.com",
          }),
        },
      ],
    ]);
    expect(result).toEqual({});
  });

  it("should post with image to Misskey.", async () => {
    // Prepare
    const mockGetMediaList = vi.spyOn(misskey, "getMediaList");
    mockGetMediaList.mockResolvedValueOnce({ data: ["media-id"] });
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
    expect(result).toEqual({});
  });

  it("should return error, if failed to get image ids.", async () => {
    // Prepare
    const mockGetMediaList = vi.spyOn(misskey, "getMediaList");
    const err = new Error("500 Server error");
    mockGetMediaList.mockResolvedValueOnce({ err });

    // Execute
    const result = await misskey.post(id, dataImage);

    // Verify
    expect(httpRequest).not.toHaveBeenCalled();
    expect(result).toEqual({ err });
  });

  it("should return error, if fetch raises an exception for Misskey.", async () => {
    // Prepare
    const mockGetMediaList = vi.spyOn(misskey, "getMediaList");
    mockGetMediaList.mockResolvedValueOnce({ data: [] });
    const err = new Error("test error");
    httpRequest.mockResolvedValueOnce({ err });

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
    expect(result).toEqual({ err });
  });
});
