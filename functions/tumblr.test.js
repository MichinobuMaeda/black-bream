import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getPublicMediaUrl, generateLinkCard, httpRequest } from "./utils.js";
import { Tumblr } from "./tumblr.js";
import { mock } from "@atproto/api";
import { error } from "firebase-functions/logger";

vi.mock("firebase-functions/logger");
vi.mock("./utils.js");

FormData.prototype.append = vi.fn();

const db = {};
const bucket = {};
const tumblr = new Tumblr(db, bucket);

const clientId = "tumblr-client-id";
const clientSecret = "tumblr-client-secret";
const callBackUrl = "http://tumblr-callback-url";
const blogId = "tumblr-blog-id";
const accessToken = "tumblr-access-token";
const refreshToken = "tumblr-refresh-token";
const expiredAt = { toDate: () => new Date(new Date().getTime() - 60 * 1000) };
const params = {
  clientId,
  clientSecret,
  callBackUrl,
  blogId,
  accessToken,
  refreshToken,
  expiredAt,
};

afterEach(() => {
  vi.clearAllMocks();
});

describe("Tumblr object", () => {
  it("should have property id === 'tumblr'.", () => {
    expect(tumblr.id).toEqual("tumblr");
  });
});

describe("post", () => {
  const id = "tumblr-id";
  const text = "Text";
  const files = ["file.jpg"];
  const postUrl = `https://api.tumblr.com/v2/blog/${blogId}/posts`;
  const postParams = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  };
  getPublicMediaUrl.mockReturnValue("https://public-media-url");
  generateLinkCard.mockReturnValue({ data: undefined });
  httpRequest.mockResolvedValue({});

  it("should return error if getParams returns error.", async () => {
    // Prepare
    const mockGetParams = vi.spyOn(tumblr, "getParams");
    const err = new Error("test error");
    mockGetParams.mockResolvedValueOnce({ err });

    // Execute
    const result = await tumblr.post(id, { text, files });

    // Verify
    expect(mockGetParams.mock.calls).toEqual([[]]);
    expect(getPublicMediaUrl).not.toHaveBeenCalled();
    expect(generateLinkCard).not.toHaveBeenCalled();
    expect(httpRequest).not.toHaveBeenCalled();
    expect(result).toEqual({ err });
  });

  it("should post only text.", async () => {
    // Prepare
    const mockGetParams = vi.spyOn(tumblr, "getParams");
    mockGetParams.mockResolvedValue({ data: params });

    // Execute
    const result = await tumblr.post(id, { text, files: undefined });

    // Verify
    expect(getPublicMediaUrl).not.toHaveBeenCalled();
    expect(generateLinkCard.mock.calls).toEqual([[text]]);
    expect(httpRequest.mock.calls).toEqual([
      [
        postUrl,
        {
          ...postParams,
          body: JSON.stringify({ content: [{ type: "text", text }] }),
        },
      ],
    ]);
    expect(result).toEqual({});
  });

  it("should post text and image", async () => {
    // Prepare
    const mockGetParams = vi.spyOn(tumblr, "getParams");
    mockGetParams.mockResolvedValue({ data: params });

    // Execute
    const result = await tumblr.post(id, { text, files });

    // Verify
    expect(getPublicMediaUrl.mock.calls).toEqual([[id, files[0]]]);
    expect(generateLinkCard).not.toHaveBeenCalled();
    expect(httpRequest.mock.calls).toEqual([
      [
        postUrl,
        {
          ...postParams,
          body: JSON.stringify({
            content: [
              { type: "image", media: { url: "https://public-media-url" } },
              { type: "text", text },
            ],
          }),
        },
      ],
    ]);
    expect(result).toEqual({});
  });

  it("should post text and link", async () => {
    // Prepare
    const mockGetParams = vi.spyOn(tumblr, "getParams");
    mockGetParams.mockResolvedValue({ data: params });
    const text = "Text https://link";
    generateLinkCard.mockResolvedValueOnce({ data: { uri: "https://link" } });

    // Execute
    const result = await tumblr.post(id, { text, files: [] });

    // Verify
    expect(getPublicMediaUrl).not.toHaveBeenCalled();
    expect(generateLinkCard.mock.calls).toEqual([[text]]);
    expect(httpRequest.mock.calls).toEqual([
      [
        postUrl,
        {
          ...postParams,
          body: JSON.stringify({
            content: [
              { type: "text", text: "Text" },
              { type: "link", url: "https://link" },
            ],
          }),
        },
      ],
    ]);
    expect(result).toEqual({});
  });

  it("should return error if post request failed.", async () => {
    // Prepare
    const mockGetParams = vi.spyOn(tumblr, "getParams");
    mockGetParams.mockResolvedValue({ data: params });
    const err = new Error("Post request failed");
    httpRequest.mockResolvedValueOnce({ err });

    // Execute
    const result = await tumblr.post(id, { text, files });

    // Verify
    expect(getPublicMediaUrl.mock.calls).toEqual([[id, files[0]]]);
    expect(generateLinkCard).not.toHaveBeenCalled();
    expect(httpRequest.mock.calls).toEqual([
      [
        postUrl,
        {
          ...postParams,
          body: JSON.stringify({
            content: [
              { type: "image", media: { url: "https://public-media-url" } },
              { type: "text", text },
            ],
          }),
        },
      ],
    ]);
    expect(result).toEqual({ err });
  });
});

describe("refreshAccessToken", () => {
  const formData = [
    ["grant_type", "refresh_token"],
    ["refresh_token", refreshToken],
    ["client_id", clientId],
    ["client_secret", clientSecret],
  ];
  const authUrl = "https://api.tumblr.com/v2/oauth2/token";
  const authParams = { method: "POST", body: expect.any(FormData) };
  const oauthData = {
    access_token: "tumblr-new-access-token",
    refresh_token: "tumblr-new-refresh-token",
    expires_in: 3600,
  };
  httpRequest.mockResolvedValue({
    data: { json: () => Promise.resolve(oauthData) },
  });
  const updateData = {
    accessToken: oauthData.access_token,
    refreshToken: oauthData.refresh_token,
    expiredAt: expect.any(Date),
  };

  it("should return error if getParams returns error.", async () => {
    // Prepare
    const mockGetParams = vi.spyOn(tumblr, "getParams");
    const err = new Error("test error");
    mockGetParams.mockResolvedValue({ err });
    const mockUpdateParams = vi.spyOn(tumblr, "updateParams");
    mockUpdateParams.mockResolvedValue({});

    // Execute
    const result = await tumblr.refreshAccessToken();

    // Verify
    expect(mockGetParams.mock.calls).toEqual([[]]);
    expect(FormData.prototype.append).not.toHaveBeenCalled();
    expect(httpRequest).not.toHaveBeenCalled();
    expect(mockUpdateParams).not.toHaveBeenCalled();
    expect(result).toEqual({ err });
  });

  it("should skip if expiredAt < now", async () => {
    // Prepare
    const mockGetParams = vi.spyOn(tumblr, "getParams");
    const mockUpdateParams = vi.spyOn(tumblr, "updateParams");
    mockUpdateParams.mockResolvedValue({});
    mockGetParams.mockResolvedValueOnce({
      data: {
        ...params,
        expiredAt: { toDate: () => new Date(new Date().getTime() + 61 * 1000) },
      },
    });

    // Execute
    const result = await tumblr.refreshAccessToken();

    // Verify
    expect(mockGetParams.mock.calls).toEqual([[]]);
    expect(FormData.prototype.append).not.toHaveBeenCalled();
    expect(httpRequest).not.toHaveBeenCalled();
    expect(mockUpdateParams).not.toHaveBeenCalled();
    expect(result).toEqual({});
  });

  it("should return error if httpRequest returns error.", async () => {
    // Prepare
    const mockGetParams = vi.spyOn(tumblr, "getParams");
    mockGetParams.mockResolvedValue({ data: params });
    const mockUpdateParams = vi.spyOn(tumblr, "updateParams");
    mockUpdateParams.mockResolvedValue({});
    const err = new Error("test error");
    httpRequest.mockResolvedValueOnce({ err });

    // Execute
    const result = await tumblr.refreshAccessToken();

    // Verify
    expect(mockGetParams.mock.calls).toEqual([[]]);
    expect(FormData.prototype.append.mock.calls).toEqual(formData);
    expect(httpRequest.mock.calls).toEqual([[authUrl, authParams]]);
    expect(mockUpdateParams).not.toHaveBeenCalled();
    expect(result).toEqual({ err });
  });

  it("should return error if updateDoc returns error.", async () => {
    // Prepare
    const mockGetParams = vi.spyOn(tumblr, "getParams");
    mockGetParams.mockResolvedValue({ data: params });
    const mockUpdateParams = vi.spyOn(tumblr, "updateParams");
    const err = new Error("test error");
    mockUpdateParams.mockResolvedValueOnce({ err });

    // Execute
    const result = await tumblr.refreshAccessToken();

    // Verify
    expect(mockGetParams.mock.calls).toEqual([[]]);
    expect(FormData.prototype.append.mock.calls).toEqual(formData);
    expect(httpRequest.mock.calls).toEqual([[authUrl, authParams]]);
    expect(mockUpdateParams.mock.calls).toEqual([[updateData]]);
    expect(result).toEqual({ err });
  });

  it("should return error if httpRequest returns error.", async () => {
    // Prepare
    const mockGetParams = vi.spyOn(tumblr, "getParams");
    mockGetParams.mockResolvedValue({ data: params });
    const mockUpdateParams = vi.spyOn(tumblr, "updateParams");
    mockUpdateParams.mockResolvedValue({ err: undefined });
    const err = new Error("test error");
    httpRequest.mockResolvedValueOnce({ err });

    // Execute
    const result = await tumblr.refreshAccessToken();

    // Verify
    expect(mockGetParams.mock.calls).toEqual([[]]);
    expect(FormData.prototype.append.mock.calls).toEqual(formData);
    expect(httpRequest.mock.calls).toEqual([[authUrl, authParams]]);
    expect(mockUpdateParams).not.toHaveBeenCalled();
    expect(result).toEqual({ err });
  });

  it("should return error if updateDoc returns error.", async () => {
    // Prepare
    const mockGetParams = vi.spyOn(tumblr, "getParams");
    mockGetParams.mockResolvedValue({ data: params });
    const mockUpdateParams = vi.spyOn(tumblr, "updateParams");
    const err = new Error("test error");
    mockUpdateParams.mockResolvedValueOnce({ err });

    // Execute
    const result = await tumblr.refreshAccessToken();

    // Verify
    expect(mockGetParams.mock.calls).toEqual([[]]);
    expect(FormData.prototype.append.mock.calls).toEqual(formData);
    expect(httpRequest.mock.calls).toEqual([[authUrl, authParams]]);
    expect(mockUpdateParams.mock.calls).toEqual([[updateData]]);
    expect(result).toEqual({ err });
  });

  it("should set new access token.", async () => {
    // Prepare
    const mockGetParams = vi.spyOn(tumblr, "getParams");
    mockGetParams.mockResolvedValue({ data: params });
    const mockUpdateParams = vi.spyOn(tumblr, "updateParams");
    mockUpdateParams.mockResolvedValue({});

    // Execute
    const result = await tumblr.refreshAccessToken();

    // Verify
    expect(mockGetParams.mock.calls).toEqual([[]]);
    expect(FormData.prototype.append.mock.calls).toEqual(formData);
    expect(httpRequest.mock.calls).toEqual([[authUrl, authParams]]);
    expect(mockUpdateParams.mock.calls).toEqual([[updateData]]);
    expect(result).toEqual({});
  });

  it("should restore old access token if failed to get new access token.", async () => {
    // Prepare
    const mockGetParams = vi.spyOn(tumblr, "getParams");
    mockGetParams.mockResolvedValue({ data: params });
    const mockUpdateParams = vi.spyOn(tumblr, "updateParams");
    mockUpdateParams.mockResolvedValue({});
    httpRequest.mockResolvedValueOnce({
      data: { json: () => Promise.resolve({}) },
    });

    // Execute
    const result = await tumblr.refreshAccessToken();

    // Verify
    expect(mockGetParams.mock.calls).toEqual([[]]);
    expect(FormData.prototype.append.mock.calls).toEqual(formData);
    expect(httpRequest.mock.calls).toEqual([[authUrl, authParams]]);
    expect(mockUpdateParams.mock.calls).toEqual([
      [
        {
          accessToken: accessToken,
          refreshToken: refreshToken,
        },
      ],
    ]);
    expect(result).toEqual({});
  });
});

describe("setAccessToken", () => {
  const code = "tumblr-code";
  const authUrl = "https://api.tumblr.com/v2/oauth2/token";
  const formData = [
    ["grant_type", "authorization_code"],
    ["code", code],
    ["client_id", clientId],
    ["client_secret", clientSecret],
    ["redirect_uri", callBackUrl],
  ];
  const authParams = {
    method: "POST",
    body: expect.any(FormData),
  };
  const oauthData = {
    access_token: "tumblr-new-access-token",
    refresh_token: "tumblr-new-refresh-token",
    expires_in: 3600,
  };
  httpRequest.mockResolvedValue({
    data: { json: () => Promise.resolve(oauthData) },
  });
  const updateData = {
    accessToken: oauthData.access_token,
    refreshToken: oauthData.refresh_token,
    expiredAt: expect.any(Date),
  };

  it("should return error if code is empty.", async () => {
    // Prepare
    const mockGetParams = vi.spyOn(tumblr, "getParams");
    mockGetParams.mockResolvedValue({ data: params });
    const mockUpdateParams = vi.spyOn(tumblr, "updateParams");
    mockUpdateParams.mockResolvedValue({});
    const code = "";

    // Execute
    const result = await tumblr.setAccessToken({ code });

    // Verify
    expect(mockGetParams).not.toHaveBeenCalled();
    expect(FormData.prototype.append).not.toHaveBeenCalled();
    expect(httpRequest).not.toHaveBeenCalled();
    expect(mockUpdateParams).not.toHaveBeenCalled();
    expect(result).toEqual({ err: new Error(`invalid code: '${code}'`) });
  });

  it("should return error if code is 'error'.", async () => {
    // Prepare
    const mockGetParams = vi.spyOn(tumblr, "getParams");
    mockGetParams.mockResolvedValue({ data: params });
    const mockUpdateParams = vi.spyOn(tumblr, "updateParams");
    mockUpdateParams.mockResolvedValue({});
    const code = "error";

    // Execute
    const result = await tumblr.setAccessToken({ code });

    // Verify
    expect(mockGetParams).not.toHaveBeenCalled();
    expect(FormData.prototype.append).not.toHaveBeenCalled();
    expect(httpRequest).not.toHaveBeenCalled();
    expect(mockUpdateParams).not.toHaveBeenCalled();
    expect(result).toEqual({ err: new Error(`invalid code: '${code}'`) });
  });

  it("should return error if getParams returns error.", async () => {
    // Prepare
    const mockGetParams = vi.spyOn(tumblr, "getParams");
    const mockUpdateParams = vi.spyOn(tumblr, "updateParams");
    mockUpdateParams.mockResolvedValue({});
    const err = new Error("test error");
    mockGetParams.mockResolvedValueOnce({ err });

    // Execute
    const result = await tumblr.setAccessToken({ code });

    // Verify
    expect(mockGetParams.mock.calls).toEqual([[]]);
    expect(FormData.prototype.append).not.toHaveBeenCalled();
    expect(httpRequest).not.toHaveBeenCalled();
    expect(mockUpdateParams).not.toHaveBeenCalled();
    expect(result).toEqual({ err });
  });

  it("should return error if httpRequest returns error.", async () => {
    // Prepare
    const mockGetParams = vi.spyOn(tumblr, "getParams");
    mockGetParams.mockResolvedValue({ data: params });
    const mockUpdateParams = vi.spyOn(tumblr, "updateParams");
    mockUpdateParams.mockResolvedValue({});
    const err = new Error("test error");
    httpRequest.mockResolvedValueOnce({ err });

    // Execute
    const result = await tumblr.setAccessToken({ code });

    // Verify
    expect(mockGetParams.mock.calls).toEqual([[]]);
    expect(FormData.prototype.append.mock.calls).toEqual(formData);
    expect(httpRequest.mock.calls).toEqual([[authUrl, authParams]]);
    expect(mockUpdateParams).not.toHaveBeenCalled();
    expect(result).toEqual({ err });
  });

  it("should return error if updateDoc returns error.", async () => {
    // Prepare
    const mockGetParams = vi.spyOn(tumblr, "getParams");
    mockGetParams.mockResolvedValue({ data: params });
    const mockUpdateParams = vi.spyOn(tumblr, "updateParams");
    const err = new Error("test error");
    mockUpdateParams.mockResolvedValueOnce({ err });

    // Execute
    const result = await tumblr.setAccessToken({ code });

    // Verify
    expect(mockGetParams.mock.calls).toEqual([[]]);
    expect(FormData.prototype.append.mock.calls).toEqual(formData);
    expect(httpRequest.mock.calls).toEqual([[authUrl, authParams]]);
    expect(mockUpdateParams.mock.calls).toEqual([[updateData]]);
    expect(result).toEqual({ err });
  });

  it("should update access token.", async () => {
    // Prepare
    const mockGetParams = vi.spyOn(tumblr, "getParams");
    mockGetParams.mockResolvedValue({ data: params });
    const mockUpdateParams = vi.spyOn(tumblr, "updateParams");
    mockUpdateParams.mockResolvedValue({});

    // Execute
    const result = await tumblr.setAccessToken({ code });

    // Verify
    expect(mockGetParams.mock.calls).toEqual([[]]);
    expect(FormData.prototype.append.mock.calls).toEqual(formData);
    expect(httpRequest.mock.calls).toEqual([[authUrl, authParams]]);
    expect(mockUpdateParams.mock.calls).toEqual([[updateData]]);
    expect(result).toEqual({});
  });

  it("should restore old params if failed to get params except access token.", async () => {
    // Prepare
    const mockGetParams = vi.spyOn(tumblr, "getParams");
    mockGetParams.mockResolvedValue({ data: params });
    const mockUpdateParams = vi.spyOn(tumblr, "updateParams");
    mockUpdateParams.mockResolvedValue({});
    const accessToken = "tumblr-access-token";
    httpRequest.mockResolvedValueOnce({
      data: { json: () => Promise.resolve({ access_token: accessToken }) },
    });

    // Execute
    const result = await tumblr.setAccessToken({ code });

    // Verify
    expect(mockGetParams.mock.calls).toEqual([[]]);
    expect(FormData.prototype.append.mock.calls).toEqual(formData);
    expect(httpRequest.mock.calls).toEqual([[authUrl, authParams]]);
    expect(mockUpdateParams.mock.calls).toEqual([
      [{ accessToken: accessToken }],
    ]);
    expect(result).toEqual({});
  });

  it("should return error if failed to get new access token.", async () => {
    // Prepare
    const mockGetParams = vi.spyOn(tumblr, "getParams");
    mockGetParams.mockResolvedValue({ data: params });
    const mockUpdateParams = vi.spyOn(tumblr, "updateParams");
    mockUpdateParams.mockResolvedValue({});
    httpRequest.mockResolvedValueOnce({
      data: { json: () => Promise.resolve({}) },
    });

    // Execute
    const result = await tumblr.setAccessToken({ code });

    // Verify
    expect(mockGetParams.mock.calls).toEqual([[]]);
    expect(FormData.prototype.append.mock.calls).toEqual(formData);
    expect(httpRequest.mock.calls).toEqual([[authUrl, authParams]]);
    expect(mockUpdateParams).not.toHaveBeenCalled();
    expect(result).toEqual({
      err: new Error("Failed to get new access_token"),
    });
  });
});
