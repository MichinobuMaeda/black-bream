import { describe, it, expect, afterEach, vi } from "vitest";
import { Timestamp } from "firebase-admin/firestore";
import { getPublicMediaUrl, httpRequest, joinLines } from "./utils.js";
import { Instagram } from "./instagram.js";

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

const db = {};
const bucket = { file: vi.fn() };
const instagram = new Instagram(db, bucket);

const clientId = "instagram-client-id";
const accessToken = "instagram-access-token";
const expiredAt = Timestamp.fromMillis(
  new Date().getTime() - 1000 * 60 * 60 * 24 + 1000,
);
const params = { clientId, accessToken, expiredAt };

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
  const title = "Title";
  const message = "Message";
  const files = ["file1", "file2"];
  const method = "POST";
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
  getPublicMediaUrl.mockImplementation(() => "public-url");
  const uploadUrl = `https://graph.instagram.com/v24.0/${clientId}/media`;
  const uploadParams1 = {
    method,
    headers,
    body: JSON.stringify({
      caption: text,
      image_url: getPublicMediaUrl(id, files[0]),
    }),
  };
  const uploadParams2 = {
    method,
    headers,
    body: JSON.stringify({
      caption: `${title}\n${message}`,
      image_url: getPublicMediaUrl(id, files[0]),
    }),
  };
  const uploadData = {
    data: {
      json: vi.fn(() => Promise.resolve({ id: "media-id" })),
    },
  };
  const publishUrl = `https://graph.instagram.com/v24.0/${clientId}/media_publish`;
  const publishParams = {
    method,
    headers,
    body: JSON.stringify({ creation_id: "media-id" }),
  };
  const publishData = {
    data: { json: vi.fn(() => Promise.resolve({ id: "post-id" })) },
  };

  const mockGetParams = vi.spyOn(instagram, "getParams");
  mockGetParams.mockResolvedValue({ data: params });

  it("should return an error if getParams returns error.", async () => {
    // Prepare
    const err = new Error("test error");
    mockGetParams.mockResolvedValueOnce({ err });

    // Execute
    const result = await instagram.post(id, { text, files });

    // Verify
    expect(uploadData.data.json).not.toHaveBeenCalled();
    expect(httpRequest).not.toHaveBeenCalled();
    expect(result).toEqual({ err });
  });

  it("should return an error if no files are provided.", async () => {
    // Prepare

    // Execute
    const result = await instagram.post(id, { text, files: [] });

    // Verify
    expect(result.err).toEqual(new Error("No media files"));
  });

  it("should return an error if the media upload fails.", async () => {
    // Prepare
    const err = new Error("test error");
    const errorData = {
      data: {
        json: vi.fn(() => Promise.resolve({ error: "Upload failed" })),
      },
    };
    httpRequest.mockResolvedValueOnce({ err, data: errorData.data });

    // Execute
    const result = await instagram.post(id, { text, files });

    // Verify
    expect(httpRequest).toHaveBeenCalledWith(
      `https://graph.instagram.com/v24.0/${clientId}/media`,
      uploadParams1,
    );
    expect(errorData.data.json).toHaveBeenCalled();
    expect(uploadData.data.json).not.toHaveBeenCalled();
    expect(result).toEqual({ err });
  });

  it("should return an error if the media publish fails.", async () => {
    // Prepare
    const err = new Error("test error");
    const publishErrorData = {
      data: {
        json: vi.fn(() => Promise.resolve({ error: "Publish failed" })),
      },
    };
    httpRequest
      .mockResolvedValueOnce(uploadData)
      .mockResolvedValueOnce({ err, data: publishErrorData.data });

    // Execute
    const result = await instagram.post(id, { text, files });

    // Verify
    expect(httpRequest.mock.calls).toEqual([
      [uploadUrl, uploadParams1],
      [publishUrl, publishParams],
    ]);
    expect(uploadData.data.json).toHaveBeenCalled();
    expect(publishErrorData.data.json).toHaveBeenCalled();
    expect(result).toEqual({ err });
  });

  it("should post with text.", async () => {
    // Prepare
    httpRequest
      .mockResolvedValueOnce(uploadData)
      .mockResolvedValueOnce(publishData);

    // Execute
    const result = await instagram.post(id, { text, files });

    // Verify
    expect(httpRequest.mock.calls).toEqual([
      [uploadUrl, uploadParams1],
      [publishUrl, publishParams],
    ]);
    expect(uploadData.data.json).toHaveBeenCalled();
    expect(result).toEqual({});
  });

  it("should post with title and message.", async () => {
    // Prepare
    const title = "Title";
    const message = "Message";
    httpRequest
      .mockResolvedValueOnce(uploadData)
      .mockResolvedValueOnce(publishData);

    // Execute
    const result = await instagram.post(id, {
      text: "",
      title,
      message,
      files,
    });

    // Verify
    expect(httpRequest.mock.calls).toEqual([
      [uploadUrl, uploadParams2],
      [publishUrl, publishParams],
    ]);
    expect(uploadData.data.json).toHaveBeenCalled();
    expect(result).toEqual({});
  });
});

describe("refreshAccessToken", () => {
  const refreshTokenUrl =
    "https://graph.instagram.com/refresh_access_token" +
    "?grant_type=ig_refresh_token" +
    "&access_token=instagram-access-token";
  const respNewAccessToken = {
    data: {
      status: 200,
      json: () =>
        Promise.resolve({
          access_token: "new-access-token",
          expires_in: 3600,
        }),
    },
  };
  const updateDataNewAccessToken = {
    accessToken: "new-access-token",
    expiredAt: expect.any(Timestamp),
  };

  it("should return error, if getParams returns error.", async () => {
    // Prepare
    const mockGetParams = vi.spyOn(instagram, "getParams");
    const mockUpdateParams = vi.spyOn(instagram, "updateParams");
    mockUpdateParams.mockResolvedValue({});
    const err = new Error("test error");
    mockGetParams.mockResolvedValueOnce({ err });

    // Execute
    const result = await instagram.refreshAccessToken();

    // Verify
    expect(mockGetParams.mock.calls).toEqual([[]]);
    expect(httpRequest).not.toHaveBeenCalled();
    expect(mockUpdateParams).not.toHaveBeenCalled();
    expect(result).toEqual({ err });
  });

  it("should return error, if no access token is set.", async () => {
    // Prepare
    const mockGetParams = vi.spyOn(instagram, "getParams");
    const mockUpdateParams = vi.spyOn(instagram, "updateParams");
    mockUpdateParams.mockResolvedValue({});
    mockGetParams.mockResolvedValueOnce({
      data: { ...params, accessToken: "" },
    });

    // Execute
    const result = await instagram.refreshAccessToken();

    // Verify
    expect(mockGetParams.mock.calls).toEqual([[]]);
    expect(httpRequest).not.toHaveBeenCalled();
    expect(mockUpdateParams).not.toHaveBeenCalled();
    expect(result).toEqual({ err: new Error("No access token") });
  });

  it("should return error if no expiration is set.", async () => {
    // Prepare
    const mockGetParams = vi.spyOn(instagram, "getParams");
    const mockUpdateParams = vi.spyOn(instagram, "updateParams");
    mockUpdateParams.mockResolvedValue({});
    mockGetParams.mockResolvedValueOnce({
      data: { ...params, expiredAt: null },
    });

    // Execute
    const result = await instagram.refreshAccessToken();

    // Verify
    expect(mockGetParams.mock.calls).toEqual([[]]);
    expect(httpRequest).not.toHaveBeenCalled();
    expect(mockUpdateParams).not.toHaveBeenCalled();
    expect(result).toEqual({ err: new Error("No expiredAt") });
  });

  it(
    "should skip the refresh," +
      " if there is more than 10 day until expiration.",
    async () => {
      // Prepare
      const mockGetParams = vi.spyOn(instagram, "getParams");
      const mockUpdateParams = vi.spyOn(instagram, "updateParams");
      mockUpdateParams.mockResolvedValue({});
      mockGetParams.mockResolvedValueOnce({
        data: {
          ...params,
          expiredAt: Timestamp.fromMillis(
            new Date().getTime() + 1000 * 60 * 60 * 24 * 10 + 1000,
          ),
        },
      });

      // Execute
      const result = await instagram.refreshAccessToken();

      // Verify
      expect(mockGetParams.mock.calls).toEqual([[]]);
      expect(httpRequest).not.toHaveBeenCalled();
      expect(mockUpdateParams).not.toHaveBeenCalled();
      expect(result).toEqual({});
    },
  );

  it("should refresh the access token.", async () => {
    // Prepare
    const mockGetParams = vi.spyOn(instagram, "getParams");
    mockGetParams.mockResolvedValue({ data: params });
    const mockUpdateParams = vi.spyOn(instagram, "updateParams");
    mockUpdateParams.mockResolvedValue({});
    httpRequest.mockResolvedValueOnce(respNewAccessToken);

    // Execute
    const result = await instagram.refreshAccessToken();

    // Verify
    expect(mockGetParams.mock.calls).toEqual([[]]);
    expect(httpRequest.mock.calls).toEqual([[refreshTokenUrl]]);
    expect(result).toEqual({});
    expect(mockUpdateParams.mock.calls).toEqual([[updateDataNewAccessToken]]);
  });

  it("should return error, if updateParams returns error.", async () => {
    // Prepare
    const mockGetParams = vi.spyOn(instagram, "getParams");
    mockGetParams.mockResolvedValue({ data: params });
    const mockUpdateParams = vi.spyOn(instagram, "updateParams");
    httpRequest.mockResolvedValueOnce(respNewAccessToken);
    const err = new Error("test error");
    mockUpdateParams.mockResolvedValueOnce({ err });

    // Execute
    const result = await instagram.refreshAccessToken();

    // Verify
    expect(mockGetParams.mock.calls).toEqual([[]]);
    expect(httpRequest.mock.calls).toEqual([[refreshTokenUrl]]);
    expect(mockUpdateParams.mock.calls).toEqual([[updateDataNewAccessToken]]);
    expect(result).toEqual({ err });
  });

  it("should return error, if httpRequest returns error.", async () => {
    // Prepare
    const mockGetParams = vi.spyOn(instagram, "getParams");
    mockGetParams.mockResolvedValue({ data: params });
    const mockUpdateParams = vi.spyOn(instagram, "updateParams");
    mockUpdateParams.mockResolvedValue({});
    const err = new Error("test error");
    httpRequest.mockResolvedValueOnce({ err });

    // Execute
    const result = await instagram.refreshAccessToken();

    // Verify
    expect(mockGetParams.mock.calls).toEqual([[]]);
    expect(httpRequest.mock.calls).toEqual([[refreshTokenUrl]]);
    expect(mockUpdateParams).not.toHaveBeenCalled();
    expect(result).toEqual({ err });
  });

  it("should return error, if fetch raises an exception.", async () => {
    // Prepare
    const mockGetParams = vi.spyOn(instagram, "getParams");
    mockGetParams.mockResolvedValue({ data: params });
    const mockUpdateParams = vi.spyOn(instagram, "updateParams");
    mockUpdateParams.mockResolvedValue({});
    const err = new Error("test error");
    httpRequest.mockResolvedValueOnce({ err });

    // Execute
    const result = await instagram.refreshAccessToken();

    // Verify
    expect(mockGetParams.mock.calls).toEqual([[]]);
    expect(httpRequest.mock.calls).toEqual([[refreshTokenUrl]]);
    expect(mockUpdateParams).not.toHaveBeenCalled();
    expect(result).toEqual({ err });
  });
});
