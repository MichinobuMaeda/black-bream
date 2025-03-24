const { describe, it, expect, afterEach } = require("@jest/globals");
const {
  getMediaAsBlob,
  httpRequest,
  getDoc,
  updateDoc,
  sleep,
} = require("./utils.js");

const { Twitter } = require("./twitter.js");

jest.mock("firebase-functions/logger");
jest.mock("./utils.js");

FormData.prototype.append = jest.fn();
URLSearchParams.prototype.append = jest.fn();

const db = {};
const bucket = { file: jest.fn() };
const twitter = new Twitter(db, bucket);

afterEach(() => {
  jest.clearAllMocks();
});

describe("Twitter object", () => {
  it("should have property id === 'twitter'.", () => {
    expect(twitter.id).toEqual("twitter");
  });
});

describe("uploadImage", () => {
  it("should upload image to Twitter with no wait.", async () => {
    // Prepare
    const accessToken = "twitter-access-token";
    const id = "post-id";
    const file = "1.jpg";
    const mediaUrl = "https://media.url/1.jpg";
    const mediaId = "media-id";
    const mediaResp = { id: mediaId };
    getMediaAsBlob.mockResolvedValue({ err: undefined, data: new Blob() });
    httpRequest.mockResolvedValue({
      err: undefined,
      data: { json: jest.fn(() => Promise.resolve(mediaResp)) },
    });

    // Execute
    const result = await twitter.uploadImage(accessToken, id, file);

    // Verify
    expect(getMediaAsBlob).toHaveBeenCalledWith(bucket, id, file);
    expect(FormData.prototype.append).toHaveBeenCalledWith(
      "media",
      expect.any(Blob),
      file,
    );
    expect(httpRequest).toHaveBeenCalledWith(
      "https://api.x.com/2/media/upload",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: expect.any(FormData),
      },
    );
    expect(sleep).not.toHaveBeenCalled();
    expect(result).toEqual({ err: undefined, data: mediaResp });
  });

  it("should upload image to Twitter with wait 10 sec.", async () => {
    // Prepare
    const accessToken = "twitter-access-token";
    const id = "post-id";
    const file = "1.jpg";
    const mediaUrl = "https://media.url/1.jpg";
    const mediaId = "media-id";
    const mediaResp = {
      id: mediaId,
      processing_info: { state: "in_progress", check_after_secs: 10 },
    };
    getMediaAsBlob.mockResolvedValue({ err: undefined, data: new Blob() });
    httpRequest.mockResolvedValue({
      err: undefined,
      data: { json: jest.fn(() => Promise.resolve(mediaResp)) },
    });

    // Execute
    const result = await twitter.uploadImage(accessToken, id, file);

    // Verify
    expect(getMediaAsBlob).toHaveBeenCalledWith(bucket, id, file);
    expect(FormData.prototype.append).toHaveBeenCalledWith(
      "media",
      expect.any(Blob),
      file,
    );
    expect(httpRequest).toHaveBeenCalledWith(
      "https://api.x.com/2/media/upload",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: expect.any(FormData),
      },
    );
    expect(sleep.mock.calls).toEqual([[10]]);
    expect(result).toEqual({ err: undefined, data: mediaResp });
  });

  it("should return error when getMediaAsBlob returns error.", async () => {
    // Prepare
    const accessToken = "twitter-access-token";
    const id = "post-id";
    const file = "1.jpg";
    const mediaUrl = "https://media.url/1.jpg";
    const mediaId = "media-id";
    const mediaResp = { id: mediaId };
    getMediaAsBlob.mockResolvedValue({ err: "get-media-error" });

    // Execute
    const result = await twitter.uploadImage(accessToken, id, file);

    // Verify
    expect(getMediaAsBlob).toHaveBeenCalledWith(bucket, id, file);
    expect(FormData.prototype.append).not.toHaveBeenCalled();
    expect(httpRequest).not.toHaveBeenCalled();
    expect(sleep).not.toHaveBeenCalled();
    expect(result).toEqual({ err: "get-media-error" });
  });

  it("should return error when httpRequest returns error.", async () => {
    // Prepare
    const accessToken = "twitter-access-token";
    const id = "post-id";
    const file = "1.jpg";
    const mediaUrl = "https://media.url/1.jpg";
    const mediaId = "media-id";
    const mediaResp = { id: mediaId };
    getMediaAsBlob.mockResolvedValue({ err: undefined, data: new Blob() });
    httpRequest.mockResolvedValue({ err: "http-request-error" });

    // Execute
    const result = await twitter.uploadImage(accessToken, id, file);

    // Verify
    expect(getMediaAsBlob).toHaveBeenCalledWith(bucket, id, file);
    expect(FormData.prototype.append).toHaveBeenCalledWith(
      "media",
      expect.any(Blob),
      file,
    );
    expect(httpRequest).toHaveBeenCalledWith(
      "https://api.x.com/2/media/upload",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: expect.any(FormData),
      },
    );
    expect(sleep).not.toHaveBeenCalled();
    expect(result).toEqual({ err: "http-request-error" });
  });
});

describe("post", () => {
  it("should post to Twitter with no media.", async () => {
    // Prepare
    const accessToken = "twitter-access-token";
    const id = "post-id";
    const text = "Hello, world!";
    const data = { text };
    const params = { accessToken };
    mockGetParams = jest.spyOn(twitter, "getParams");
    mockGetParams.mockResolvedValue({ err: undefined, data: params });
    httpRequest.mockResolvedValue({ err: undefined, data: {} });

    // Execute
    const result = await twitter.post(id, data);

    // Verify
    expect(mockGetParams.mock.calls).toEqual([[]]);
    expect(httpRequest).toHaveBeenCalledWith("https://api.x.com/2/tweets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });
    expect(result).toEqual({ err: undefined });
  });

  it("should post to Twitter with media.", async () => {
    // Prepare
    const accessToken = "twitter-access-token";
    const id = "post-id";
    const text = "Hello, world!";
    const files = ["1.jpg"];
    const data = { text, files };
    const params = { accessToken };
    mockGetParams = jest.spyOn(twitter, "getParams");
    mockGetParams.mockResolvedValue({ err: undefined, data: params });
    mockUploadImage = jest.spyOn(twitter, "uploadImage");
    mockUploadImage.mockResolvedValue({
      err: undefined,
      data: { id: "media-id" },
    });
    httpRequest.mockResolvedValue({ err: undefined, data: {} });

    // Execute
    const result = await twitter.post(id, data);

    // Verify
    expect(mockGetParams.mock.calls).toEqual([[]]);
    expect(mockUploadImage.mock.calls).toEqual([[accessToken, id, files[0]]]);
    expect(httpRequest).toHaveBeenCalledWith("https://api.x.com/2/tweets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text, media: { media_ids: ["media-id"] } }),
    });
    expect(result).toEqual({ err: undefined });
  });

  it("should return error when getParams returns error.", async () => {
    // Prepare
    const accessToken = "twitter-access-token";
    const id = "post-id";
    const text = "Hello, world!";
    const data = { text };
    mockGetParams = jest.spyOn(twitter, "getParams");
    mockGetParams.mockResolvedValue({ err: "get-params-error" });

    // Execute
    const result = await twitter.post(id, data);

    // Verify
    expect(mockGetParams.mock.calls).toEqual([[]]);
    expect(httpRequest).not.toHaveBeenCalled();
    expect(result).toEqual({ err: "get-params-error" });
  });

  it("should return error when uploadImage returns error.", async () => {
    // Prepare
    const accessToken = "twitter-access-token";
    const id = "post-id";
    const text = "Hello, world!";
    const files = ["1.jpg"];
    const data = { text, files };
    const params = { accessToken };
    mockGetParams = jest.spyOn(twitter, "getParams");
    mockGetParams.mockResolvedValue({ err: undefined, data: params });
    mockUploadImage = jest.spyOn(twitter, "uploadImage");
    mockUploadImage.mockResolvedValue({ err: "upload-image-error" });

    // Execute
    const result = await twitter.post(id, data);

    // Verify
    expect(mockGetParams.mock.calls).toEqual([[]]);
    expect(mockUploadImage.mock.calls).toEqual([[accessToken, id, files[0]]]);
    expect(httpRequest).not.toHaveBeenCalled();
    expect(result).toEqual({ err: "upload-image-error" });
  });

  it("should return error when httpRequest returns error.", async () => {
    // Prepare
    const accessToken = "twitter-access-token";
    const id = "post-id";
    const text = "Hello, world!";
    const files = ["1.jpg"];
    const data = { text };
    const params = { accessToken };
    mockGetParams = jest.spyOn(twitter, "getParams");
    mockGetParams.mockResolvedValue({ err: undefined, data: params });
    httpRequest.mockResolvedValue({ err: "http-request-error" });

    // Execute
    const result = await twitter.post(id, data);

    // Verify
    expect(mockGetParams.mock.calls).toEqual([[]]);
    expect(httpRequest).toHaveBeenCalledWith("https://api.x.com/2/tweets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });
    expect(result).toEqual({ err: "http-request-error" });
  });
});

describe("refreshAccessToken", () => {
  const params = {
    clientId: "twitter-client-id",
    clientSecret: "twitter-client-secret",
    refreshToken: "twitter-refresh-token",
    expiredAt: { toDate: () => new Date() },
  };
  const respData = {
    access_token: "new-access-token",
    refresh_token: "new-refresh-token",
    expires_in: 2 * 3600,
  };
  const basic = Buffer.from(
    `${params.clientId}:${params.clientSecret}`,
  ).toString("base64");

  it("should refresh access token.", async () => {
    // Prepare
    mockGetParams = jest.spyOn(twitter, "getParams");
    mockGetParams.mockResolvedValue({ err: undefined, data: params });
    httpRequest.mockResolvedValue({
      err: undefined,
      data: { json: () => Promise.resolve(respData) },
    });
    mockUpdateParams = jest.spyOn(twitter, "updateParams");
    mockUpdateParams.mockResolvedValue({ err: undefined });

    // Execute
    const result = await twitter.refreshAccessToken();

    // Verify
    expect(mockGetParams.mock.calls).toEqual([[]]);
    expect(URLSearchParams.prototype.append.mock.calls).toEqual([
      ["refresh_token", params.refreshToken],
      ["grant_type", "refresh_token"],
    ]);
    expect(httpRequest).toHaveBeenCalledWith(
      "https://api.x.com/2/oauth2/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${basic}`,
        },
        body: expect.any(URLSearchParams),
      },
    );
    expect(mockUpdateParams.mock.calls).toEqual([
      [
        {
          accessToken: respData.access_token,
          refreshToken: respData.refresh_token,
          expiredAt: expect.any(Date),
        },
      ],
    ]);
    expect(result).toEqual({ data: respData.access_token });
  });

  it("should not refresh access token without expiration.", async () => {
    // Prepare
    mockGetParams = jest.spyOn(twitter, "getParams");
    mockGetParams.mockResolvedValue({
      err: undefined,
      data: {
        ...params,
        expiredAt: {
          toDate: () => new Date(new Date().getTime() + 4 * 60 * 1000),
        },
      },
    });

    // Execute
    const result = await twitter.refreshAccessToken();

    // Verify
    expect(mockGetParams.mock.calls).toEqual([[]]);
    expect(httpRequest).not.toHaveBeenCalled();
    expect(result).toEqual({ err: undefined });
  });

  it("should return error when getParams returns error.", async () => {
    // Prepare
    mockGetParams = jest.spyOn(twitter, "getParams");
    mockGetParams.mockResolvedValue({ err: "get-params-error" });

    // Execute
    const result = await twitter.refreshAccessToken();

    // Verify
    expect(mockGetParams.mock.calls).toEqual([[]]);
    expect(httpRequest).not.toHaveBeenCalled();
    expect(result).toEqual({ err: "get-params-error" });
  });

  it("should return error when httpRequest returns error.", async () => {
    // Prepare
    mockGetParams = jest.spyOn(twitter, "getParams");
    mockGetParams.mockResolvedValue({ err: undefined, data: params });
    httpRequest.mockResolvedValue({ err: "http-request-error" });

    // Execute
    const result = await twitter.refreshAccessToken();

    // Verify
    expect(mockGetParams.mock.calls).toEqual([[]]);
    expect(httpRequest).toHaveBeenCalledWith(
      "https://api.x.com/2/oauth2/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${basic}`,
        },
        body: expect.any(URLSearchParams),
      },
    );
    expect(result).toEqual({ err: "/2/oauth2/token: http-request-error" });
  });

  it("should return error when access_token is not returned.", async () => {
    // Prepare
    mockGetParams = jest.spyOn(twitter, "getParams");
    mockGetParams.mockResolvedValue({ err: undefined, data: params });
    httpRequest.mockResolvedValue({
      err: undefined,
      data: { json: () => Promise.resolve({}) },
    });

    // Execute
    const result = await twitter.refreshAccessToken();

    // Verify
    expect(mockGetParams.mock.calls).toEqual([[]]);
    expect(httpRequest).toHaveBeenCalledWith(
      "https://api.x.com/2/oauth2/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${basic}`,
        },
        body: expect.any(URLSearchParams),
      },
    );
    expect(result).toEqual({ err: "Failed to get new access_token" });
  });

  it("should skip update refreshToke or expiredAt without new values.", async () => {
    // Prepare
    const access_token = "new-access-token";
    mockGetParams = jest.spyOn(twitter, "getParams");
    mockGetParams.mockResolvedValue({ err: undefined, data: params });
    httpRequest.mockResolvedValue({
      err: undefined,
      data: {
        json: () => Promise.resolve({ access_token }),
      },
    });
    mockUpdateParams = jest.spyOn(twitter, "updateParams");
    mockUpdateParams.mockResolvedValue({ err: undefined });

    // Execute
    const result = await twitter.refreshAccessToken();

    // Verify
    expect(mockGetParams.mock.calls).toEqual([[]]);
    expect(httpRequest).toHaveBeenCalledWith(
      "https://api.x.com/2/oauth2/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${basic}`,
        },
        body: expect.any(URLSearchParams),
      },
    );
    expect(mockUpdateParams.mock.calls).toEqual([
      [{ accessToken: access_token }],
    ]);
    expect(result).toEqual({ data: "new-access-token" });
  });

  it("should return error when updateParams returns error.", async () => {
    // Prepare
    mockGetParams = jest.spyOn(twitter, "getParams");
    mockGetParams.mockResolvedValue({ err: undefined, data: params });
    httpRequest.mockResolvedValue({
      err: undefined,
      data: { json: () => Promise.resolve(respData) },
    });
    mockUpdateParams = jest.spyOn(twitter, "updateParams");
    mockUpdateParams.mockResolvedValue({ err: "update-params-error" });

    // Execute
    const result = await twitter.refreshAccessToken();

    // Verify
    expect(mockGetParams.mock.calls).toEqual([[]]);
    expect(httpRequest).toHaveBeenCalledWith(
      "https://api.x.com/2/oauth2/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${basic}`,
        },
        body: expect.any(URLSearchParams),
      },
    );
    expect(mockUpdateParams.mock.calls).toEqual([
      [
        {
          accessToken: respData.access_token,
          refreshToken: respData.refresh_token,
          expiredAt: expect.any(Date),
        },
      ],
    ]);
    expect(result).toEqual({ err: "update-params-error" });
  });
});

describe("setAccessToken", () => {
  const data = {
    status: "ok",
    code: "123456",
    challenge: "ABCDEF",
  };
  const params = {
    clientId: "twitter-client-id",
    clientSecret: "twitter-client-secret",
    callBackUrl: "https://callback.url",
  };
  const respData = {
    access_token: "new-access-token",
    refresh_token: "new-refresh-token",
    expires_in: 2 * 3600,
  };
  const basic = Buffer.from(
    `${params.clientId}:${params.clientSecret}`,
  ).toString("base64");

  it("should set access token.", async () => {
    // Prepare
    mockGetParams = jest.spyOn(twitter, "getParams");
    mockGetParams.mockResolvedValue({ data: params });
    httpRequest.mockResolvedValue({
      err: undefined,
      data: { json: () => Promise.resolve(respData) },
    });
    mockUpdateParams = jest.spyOn(twitter, "updateParams");
    mockUpdateParams.mockResolvedValue({ err: undefined });

    // Execute
    const result = await twitter.setAccessToken(data);

    // Verify
    expect(mockGetParams.mock.calls).toEqual([[]]);
    expect(URLSearchParams.prototype.append.mock.calls).toEqual([
      ["code", data.code],
      ["grant_type", "authorization_code"],
      ["redirect_uri", params.callBackUrl],
      ["code_verifier", data.challenge],
    ]);
    expect(httpRequest).toHaveBeenCalledWith(
      "https://api.x.com/2/oauth2/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${basic}`,
        },
        body: expect.any(URLSearchParams),
      },
    );
    expect(mockUpdateParams.mock.calls).toEqual([
      [
        {
          accessToken: respData.access_token,
          refreshToken: respData.refresh_token,
          expiredAt: expect.any(Date),
        },
      ],
    ]);
    expect(result).toEqual({ err: undefined });
  });

  it("should return error when status is empty.", async () => {
    // Prepare

    // Execute
    const result = await twitter.setAccessToken({ ...data, status: undefined });

    // Verify
    expect(result).toEqual({ err: "invalid status: undefined" });
  });

  it("should return error when status is 'ng'.", async () => {
    // Prepare

    // Execute
    const result = await twitter.setAccessToken({ ...data, status: "ng" });

    // Verify
    expect(result).toEqual({ err: "invalid status: ng" });
  });

  it("should return error when code is empty.", async () => {
    // Prepare

    // Execute
    const result = await twitter.setAccessToken({ ...data, code: undefined });

    // Verify
    expect(result).toEqual({ err: "invalid code: undefined" });
  });

  it("should return error when code is 'error'.", async () => {
    // Prepare

    // Execute
    const result = await twitter.setAccessToken({ ...data, code: "error" });

    // Verify
    expect(result).toEqual({ err: "invalid code: error" });
  });

  it("should return error when challenge is empty.", async () => {
    // Prepare

    // Execute
    const result = await twitter.setAccessToken({
      ...data,
      challenge: undefined,
    });

    // Verify
    expect(result).toEqual({ err: "invalid challenge: undefined" });
  });

  it("should return error when getParams returns error.", async () => {
    // Prepare
    mockGetParams = jest.spyOn(twitter, "getParams");
    mockGetParams.mockResolvedValue({ err: "get-params-error" });

    // Execute
    const result = await twitter.setAccessToken(data);

    // Verify
    expect(mockGetParams.mock.calls).toEqual([[]]);
    expect(httpRequest).not.toHaveBeenCalled();
    expect(result).toEqual({ err: "get-params-error" });
  });

  it("should return error when httpRequest returns error.", async () => {
    // Prepare
    mockGetParams = jest.spyOn(twitter, "getParams");
    mockGetParams.mockResolvedValue({ data: params });
    httpRequest.mockResolvedValue({ err: "http-request-error" });

    // Execute
    const result = await twitter.setAccessToken(data);

    // Verify
    expect(mockGetParams.mock.calls).toEqual([[]]);
    expect(httpRequest).toHaveBeenCalledWith(
      "https://api.x.com/2/oauth2/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${basic}`,
        },
        body: expect.any(URLSearchParams),
      },
    );
    expect(result).toEqual({ err: "/2/oauth2/token: http-request-error" });
  });

  it("should return error when access_token is not returned.", async () => {
    // Prepare
    mockGetParams = jest.spyOn(twitter, "getParams");
    mockGetParams.mockResolvedValue({ data: params });
    httpRequest.mockResolvedValue({
      err: undefined,
      data: {
        json: () => Promise.resolve({ ...respData, access_token: undefined }),
      },
    });

    // Execute
    const result = await twitter.setAccessToken(data);

    // Verify
    expect(mockGetParams.mock.calls).toEqual([[]]);
    expect(httpRequest).toHaveBeenCalledWith(
      "https://api.x.com/2/oauth2/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${basic}`,
        },
        body: expect.any(URLSearchParams),
      },
    );
    expect(result).toEqual({ err: "Failed to get new access_token" });
  });

  it("should skip update refreshToke or expiredAt without new values.", async () => {
    // Prepare
    mockGetParams = jest.spyOn(twitter, "getParams");
    mockGetParams.mockResolvedValue({ data: params });
    httpRequest.mockResolvedValue({
      err: undefined,
      data: {
        json: () =>
          Promise.resolve({
            ...respData,
            refresh_token: undefined,
            expires_in: undefined,
          }),
      },
    });
    mockUpdateParams = jest.spyOn(twitter, "updateParams");
    mockUpdateParams.mockResolvedValue({ err: undefined });

    // Execute
    const result = await twitter.setAccessToken(data);

    // Verify
    expect(mockGetParams.mock.calls).toEqual([[]]);
    expect(URLSearchParams.prototype.append.mock.calls).toEqual([
      ["code", data.code],
      ["grant_type", "authorization_code"],
      ["redirect_uri", params.callBackUrl],
      ["code_verifier", data.challenge],
    ]);
    expect(httpRequest).toHaveBeenCalledWith(
      "https://api.x.com/2/oauth2/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${basic}`,
        },
        body: expect.any(URLSearchParams),
      },
    );
    expect(mockUpdateParams.mock.calls).toEqual([
      [{ accessToken: respData.access_token }],
    ]);
    expect(result).toEqual({ err: undefined });
  });

  it("should return error when updateParams returns error.", async () => {
    // Prepare
    mockGetParams = jest.spyOn(twitter, "getParams");
    mockGetParams.mockResolvedValue({ data: params });
    httpRequest.mockResolvedValue({
      err: undefined,
      data: { json: () => Promise.resolve(respData) },
    });
    mockUpdateParams = jest.spyOn(twitter, "updateParams");
    mockUpdateParams.mockResolvedValue({ err: "update-params-error" });

    // Execute
    const result = await twitter.setAccessToken(data);

    // Verify
    expect(mockGetParams.mock.calls).toEqual([[]]);
    expect(httpRequest).toHaveBeenCalledWith(
      "https://api.x.com/2/oauth2/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${basic}`,
        },
        body: expect.any(URLSearchParams),
      },
    );
    expect(mockUpdateParams.mock.calls).toEqual([
      [
        {
          accessToken: respData.access_token,
          refreshToken: respData.refresh_token,
          expiredAt: expect.any(Date),
        },
      ],
    ]);
    expect(result).toEqual({ err: "update-params-error" });
  });
});
