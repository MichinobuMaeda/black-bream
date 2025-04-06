import { describe, it, expect, afterEach, vi } from "vitest";
import { getPublicMediaUrl, httpRequest, sleep } from "./utils.js";
import { Instagram } from "./instagram.js";

vi.mock("firebase-functions/logger");
vi.mock("./utils.js");

FormData.prototype.append = vi.fn();

const db = {};
const bucket = { file: vi.fn() };
const instagram = new Instagram(db, bucket);

const orgTimeout = process.env.IMAGE_UPLOAD_TIMEOUT;

const clientId = "instagram-client-id";
const accessToken = "instagram-access-token";
const params = { clientId, accessToken };

afterEach(() => {
  vi.clearAllMocks();
});

describe("Instagram object", () => {
  it("should have property id === 'instagram'.", () => {
    expect(instagram.id).toEqual("instagram");
  });
});

describe("Instagram.post", () => {
  const id = "instagram-id";
  const text = "Text";
  const files = ["file1", "file2"];
  getPublicMediaUrl.mockImplementation(() => "public-url");
  const uploadUrl = `https://graph.instagram.com/v22.0/${clientId}/media`;
  const uploadParams = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      caption: text,
      image_url: getPublicMediaUrl(id, files[0]),
    }),
  };
  const uploadData = {
    data: {
      json: vi.fn(() => Promise.resolve({ id: "media-id" })),
    },
  };
  const publishUrl = `https://graph.instagram.com/v22.0/${clientId}/media_publish`;
  const publishParams = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ creation_id: "media-id" }),
  };
  const publishData = {
    data: { json: vi.fn(() => Promise.resolve({ id: "post-id" })) },
  };

  const mockGetParams = vi.spyOn(instagram, "getParams");
  mockGetParams.mockResolvedValue({ data: params });

  it("should return an error if getParams returns error.", async () => {
    // Prepare
    mockGetParams.mockResolvedValueOnce({ err: "Error" });

    // Execute
    const result = await instagram.post(id, { text, files });

    // Verify
    expect(uploadData.data.json).not.toHaveBeenCalled();
    expect(httpRequest).not.toHaveBeenCalled();
    expect(result.err).toEqual("Error");
  });

  it("should return an error if no files are provided.", async () => {
    // Prepare

    // Execute
    const result = await instagram.post(id, { text, files: [] });

    // Verify
    expect(result.err).toEqual("No media files");
  });

  it("should return an error if the media upload fails.", async () => {
    // Prepare
    httpRequest.mockResolvedValueOnce({ err: "Error" });

    // Execute
    const result = await instagram.post(id, { text, files });

    // Verify
    expect(httpRequest).toHaveBeenCalledWith(
      `https://graph.instagram.com/v22.0/${clientId}/media`,
      uploadParams,
    );
    expect(uploadData.data.json).not.toHaveBeenCalled();
    expect(result.err).toEqual("Failed to create container: Error");
  });

  it("should return an error if the media publish fails.", async () => {
    // Prepare
    httpRequest
      .mockResolvedValueOnce(uploadData)
      .mockResolvedValueOnce({ err: "Error" });

    // Execute
    const result = await instagram.post(id, { text, files });

    // Verify
    expect(httpRequest.mock.calls).toEqual([
      [uploadUrl, uploadParams],
      [publishUrl, publishParams],
    ]);
    expect(uploadData.data.json).toHaveBeenCalled();
    expect(result.err).toEqual("Failed to publish: Error");
  });

  it("should return no error if the media is published successfully.", async () => {
    // Prepare
    httpRequest
      .mockResolvedValueOnce(uploadData)
      .mockResolvedValueOnce(publishData);

    // Execute
    const result = await instagram.post(id, { text, files });

    // Verify
    expect(httpRequest.mock.calls).toEqual([
      [uploadUrl, uploadParams],
      [publishUrl, publishParams],
    ]);
    expect(uploadData.data.json).toHaveBeenCalled();
    expect(result.err).toBeUndefined();
  });
});
