const { describe, it, expect, afterEach } = require("@jest/globals");
const { Timestamp } = require("firebase-admin/firestore");
const storage = require("firebase-admin/storage");

const { httpRequest, getPublicMediaUrl } = require("./utils.js");
const { Threads } = require("./threads.js");

jest.mock("firebase-functions/logger");
jest.mock("firebase-admin/storage");
jest.mock("./utils.js");

const authSnap = {
  exists: true,
  data: () => authData,
  get: jest.fn(),
};
const authRef = {
  get: jest.fn(() => Promise.resolve(authSnap)),
  update: jest.fn(() => Promise.resolve()),
};
const collection = {
  doc: jest.fn(() => authRef),
};
const db = {
  collection: jest.fn(() => collection),
};
const contents = [new ArrayBuffer(8)];
const fileRef = { download: jest.fn(() => Promise.resolve(contents)) };
const bucket = { file: jest.fn(() => fileRef) };
const threads = new Threads(db, bucket);

const params = {
  clientId: "threads-client-id",
  clientSecret: "threads-client-secret",
  callBackUrl: "http://example.com/threads/callback/",
  userId: "threads-userId",
  accessToken: "threads-access-token",
  expiredAt: Timestamp.fromMillis(
    new Date().getTime() - 1000 * 60 * 60 * 24 + 1000,
  ),
};

storage.getDownloadURL = jest.fn(() => Promise.resolve("download-url"));

afterEach(() => {
  jest.clearAllMocks();
});

describe("Threads object", () => {
  it("should have property id === 'threads'.", () => {
    expect(threads.id).toEqual("threads");
  });
});

describe("post", () => {
  const id = "post-id";
  const dataText = { text: "Text" };
  const dataImage = { text: "Text", files: ["1.jpg"] };
  getPublicMediaUrl.mockImplementation(
    (id, file) => `https://public-post-media-url/public/posts/${id}/${file}`,
  );

  const mockGetParams = jest.spyOn(threads, "getParams");
  mockGetParams.mockResolvedValue({ data: params });

  it("should return error, if getParams returns error.", async () => {
    // Prepare
    mockGetParams.mockResolvedValueOnce({ err: "Error" });

    // Execute
    const result = await threads.post(id, dataText);

    // Verify
    expect(mockGetParams.mock.calls).toEqual([[]]);
    expect(httpRequest).not.toHaveBeenCalled();
    expect(result).toEqual({ err: "Error" });
  });

  it("should post to Threads.", async () => {
    // Prepare
    httpRequest
      .mockResolvedValueOnce({
        data: {
          status: 200,
          json: () => Promise.resolve({ id: "01234566789" }),
        },
      })
      .mockResolvedValueOnce({ data: { status: 200 } });

    // Execute
    const result = await threads.post(id, dataText);

    // Verify
    expect(httpRequest.mock.calls).toEqual([
      [
        `https://graph.threads.net/v1.0/${params.userId}/threads` +
          "?media_type=TEXT" +
          `&text=${encodeURIComponent("Text")}` +
          `&access_token=${params.accessToken}`,
        { method: "POST" },
      ],
      [
        `https://graph.threads.net/v1.0/${params.userId}/threads_publish` +
          "?creation_id=01234566789" +
          `&access_token=${params.accessToken}`,
        { method: "POST" },
      ],
    ]);
    expect(result).toEqual({ err: undefined });
  });

  it("should post with image to Threads.", async () => {
    // Prepare
    httpRequest
      .mockResolvedValueOnce({
        data: {
          status: 200,
          json: () => Promise.resolve({ id: "01234566789" }),
        },
      })
      .mockResolvedValueOnce({ data: { status: 200 } });

    // Execute
    const result = await threads.post(id, dataImage);

    // Verify
    expect(httpRequest.mock.calls).toEqual([
      [
        `https://graph.threads.net/v1.0/${params.userId}/threads` +
          "?media_type=IMAGE" +
          `&text=${encodeURIComponent("Text")}` +
          "&image_url=https://public-post-media-url/public/posts/post-id/1.jpg" +
          `&access_token=${params.accessToken}`,
        { method: "POST" },
      ],
      [
        `https://graph.threads.net/v1.0/${params.userId}/threads_publish` +
          "?creation_id=01234566789" +
          `&access_token=${params.accessToken}`,
        { method: "POST" },
      ],
    ]);
    expect(result).toEqual({ err: undefined });
  });

  it("should return error, if axis.post raises an exception for Threads.", async () => {
    // Prepare
    httpRequest.mockResolvedValueOnce({ err: "error" });

    // Execute
    const result = await threads.post(id, dataText);

    // Verify
    expect(result).toEqual({ err: "Failed to create container: error" });
    expect(httpRequest.mock.calls).toEqual([
      [
        `https://graph.threads.net/v1.0/${params.userId}/threads` +
          "?media_type=TEXT" +
          `&text=${encodeURIComponent("Text")}` +
          `&access_token=${params.accessToken}`,
        { method: "POST" },
      ],
    ]);
  });

  it("should return error, if axis.post returns error status for Threads.", async () => {
    // Prepare
    httpRequest.mockResolvedValueOnce({ err: "500 Server error" });

    // Execute
    const result = await threads.post(id, dataText);

    // Verify
    expect(httpRequest.mock.calls).toEqual([
      [
        `https://graph.threads.net/v1.0/${params.userId}/threads` +
          "?media_type=TEXT" +
          `&text=${encodeURIComponent("Text")}` +
          `&access_token=${params.accessToken}`,
        { method: "POST" },
      ],
    ]);
    expect(result).toEqual({
      err: "Failed to create container: 500 Server error",
    });
  });

  it("should return error, if axis.post returns error status for Threads #2.", async () => {
    // Prepare
    httpRequest
      .mockResolvedValueOnce({
        data: {
          status: 200,
          json: () => Promise.resolve({ id: "01234566789" }),
        },
      })
      .mockResolvedValueOnce({ err: "500 Server error" });

    // Execute
    const result = await threads.post(id, dataText);

    // Verify
    expect(httpRequest.mock.calls).toEqual([
      [
        `https://graph.threads.net/v1.0/${params.userId}/threads` +
          "?media_type=TEXT" +
          `&text=${encodeURIComponent("Text")}` +
          `&access_token=${params.accessToken}`,
        { method: "POST" },
      ],
      [
        `https://graph.threads.net/v1.0/${params.userId}/threads_publish` +
          "?creation_id=01234566789" +
          `&access_token=${params.accessToken}`,
        { method: "POST" },
      ],
    ]);
    expect(result).toEqual({ err: "500 Server error" });
  });
});

describe("refreshAccessToken", () => {
  const refreshTokenUrl =
    "https://https://graph.threads.net/refresh_access_token" +
    "?grant_type=th_refresh_token" +
    "&access_token=threads-access-token";
  const respNewAccessToken = {
    data: {
      status: 200,
      json: () =>
        Promise.resolve({
          access_token: "new-access-token",
          expiredIn: 3600,
        }),
    },
  };
  const updateDataNewAccessToken = {
    accessToken: "new-access-token",
    expiredAt: expect.any(Date),
  };
  const mockGetParams = jest.spyOn(threads, "getParams");
  mockGetParams.mockResolvedValue({ data: params });
  const mockUpdateParams = jest.spyOn(threads, "updateParams");
  mockUpdateParams.mockResolvedValue({});

  it("should return error, if getParams returns error.", async () => {
    // Prepare
    mockGetParams.mockResolvedValueOnce({ err: "Error" });

    // Execute
    const result = await threads.refreshAccessToken();

    // Verify
    expect(mockGetParams.mock.calls).toEqual([[]]);
    expect(httpRequest).not.toHaveBeenCalled();
    expect(mockUpdateParams).not.toHaveBeenCalled();
    expect(result).toEqual({ err: "Error" });
  });

  it("should skip the refresh, if no access token is set.", async () => {
    // Prepare
    mockGetParams.mockResolvedValueOnce({
      data: { ...params, accessToken: "" },
    });

    // Execute
    const result = await threads.refreshAccessToken();

    // Verify
    expect(mockGetParams.mock.calls).toEqual([[]]);
    expect(httpRequest).not.toHaveBeenCalled();
    expect(mockUpdateParams).not.toHaveBeenCalled();
    expect(result).toEqual({ err: undefined });
  });

  it("should skip the refresh," + " if no expiration is set.", async () => {
    // Prepare
    mockGetParams.mockResolvedValueOnce({
      data: { ...params, expiredAt: null },
    });

    // Execute
    const result = await threads.refreshAccessToken();

    // Verify
    expect(mockGetParams.mock.calls).toEqual([[]]);
    expect(httpRequest).not.toHaveBeenCalled();
    expect(mockUpdateParams).not.toHaveBeenCalled();
    expect(result).toEqual({ err: undefined });
  });

  it(
    "should skip the refresh," +
      " if there is more than a day until expiration.",
    async () => {
      // Prepare
      mockGetParams.mockResolvedValueOnce({
        data: {
          ...params,
          expiredAt: Timestamp.fromMillis(
            new Date().getTime() - 1000 * 60 * 60 * 24 - 1000,
          ),
        },
      });

      // Execute
      const result = await threads.refreshAccessToken();

      // Verify
      expect(mockGetParams.mock.calls).toEqual([[]]);
      expect(httpRequest).not.toHaveBeenCalled();
      expect(mockUpdateParams).not.toHaveBeenCalled();
      expect(result).toEqual({ err: undefined });
    },
  );

  it("should refresh the access token.", async () => {
    // Prepare
    httpRequest.mockResolvedValueOnce(respNewAccessToken);

    // Execute
    const result = await threads.refreshAccessToken();

    // Verify
    expect(mockGetParams.mock.calls).toEqual([[]]);
    expect(httpRequest.mock.calls).toEqual([[refreshTokenUrl]]);
    expect(mockUpdateParams.mock.calls).toEqual([[updateDataNewAccessToken]]);
    expect(result).toEqual({ err: undefined });
  });

  it("should return error, if updateParams returns error.", async () => {
    // Prepare
    httpRequest.mockResolvedValueOnce(respNewAccessToken);
    mockUpdateParams.mockResolvedValueOnce({ err: "error" });

    // Execute
    const result = await threads.refreshAccessToken();

    // Verify
    expect(mockGetParams.mock.calls).toEqual([[]]);
    expect(httpRequest.mock.calls).toEqual([[refreshTokenUrl]]);
    expect(mockUpdateParams.mock.calls).toEqual([[updateDataNewAccessToken]]);
    expect(result).toEqual({ err: "error" });
  });

  it("should return error, if httpRequest returns error.", async () => {
    // Prepare
    httpRequest.mockResolvedValueOnce({ err: "500 Server error" });

    // Execute
    const result = await threads.refreshAccessToken();

    // Verify
    expect(mockGetParams.mock.calls).toEqual([[]]);
    expect(httpRequest.mock.calls).toEqual([[refreshTokenUrl]]);
    expect(mockUpdateParams).not.toHaveBeenCalled();
    expect(result).toEqual({
      err: "Failed to refresh Threads access token: 500 Server error",
    });
  });

  it("should return error, if fetch raises an exception.", async () => {
    // Prepare
    httpRequest.mockResolvedValueOnce({ err: "error" });

    // Execute
    const result = await threads.refreshAccessToken();

    // Verify
    expect(mockGetParams.mock.calls).toEqual([[]]);
    expect(httpRequest.mock.calls).toEqual([[refreshTokenUrl]]);
    expect(mockUpdateParams).not.toHaveBeenCalled();
    expect(result).toEqual({
      err: "Failed to refresh Threads access token: error",
    });
  });
});

describe("setAccessToken", () => {
  const data = {
    code: "threads-code",
  };
  const formData = [
    ["client_id", params.clientId],
    ["client_secret", params.clientSecret],
    ["grant_type", "authorization_code"],
    ["redirect_uri", params.callBackUrl],
    ["code", data.code],
  ];
  const oauthData = {
    access_token: "threads-access-token",
    user_id: "threads-user-id",
  };
  const tokenData = {
    access_token: "threads-new-access-token",
    expires_in: 3600,
  };
  const updateData = {
    accessToken: tokenData.access_token,
    userId: oauthData.user_id,
    expiredAt: expect.any(Date),
  };
  const httpPostParams = [
    "https://graph.threads.net/oauth/access_token",
    { method: "POST", body: expect.any(FormData) },
  ];
  const httpGetParams = [
    "https://graph.threads.net/access_token" +
      "?grant_type=th_exchange_token" +
      `&client_secret=${params.clientSecret}` +
      `&access_token=${oauthData.access_token}`,
  ];
  const mockGetParams = jest.spyOn(threads, "getParams");
  mockGetParams.mockResolvedValue({ data: params });
  const mockUpdateParams = jest.spyOn(threads, "updateParams");
  mockUpdateParams.mockResolvedValueOnce({});

  it("should update the access token.", async () => {
    // Prepare
    httpRequest
      .mockResolvedValueOnce({
        data: { json: () => Promise.resolve(oauthData) },
      })
      .mockResolvedValueOnce({
        data: { json: () => Promise.resolve(tokenData) },
      });

    // Execute
    const result = await threads.setAccessToken(data);

    // Verify
    expect(mockGetParams.mock.calls).toEqual([[]]);
    expect(httpRequest.mock.calls).toEqual([httpPostParams, httpGetParams]);
    expect(mockUpdateParams.mock.calls).toEqual([[updateData]]);
    expect(result).toEqual({ err: undefined });
  });

  it("should return error, if no code is set.", async () => {
    // Prepare
    const result = await threads.setAccessToken({ code: "" });

    // Verify
    expect(mockGetParams).not.toHaveBeenCalled();
    expect(httpRequest).not.toHaveBeenCalled();
    expect(mockUpdateParams).not.toHaveBeenCalled();
    expect(result).toEqual({ err: "No code" });
  });

  it("should return error, if getDoc returns error.", async () => {
    // Prepare
    mockGetParams.mockResolvedValueOnce({ err: "error" });

    // Execute
    const result = await threads.setAccessToken(data);

    // Verify
    expect(mockGetParams.mock.calls).toEqual([[]]);
    expect(httpRequest).not.toHaveBeenCalled();
    expect(mockUpdateParams).not.toHaveBeenCalled();
    expect(result).toEqual({ err: "error" });
  });

  it("should return error, if failed to auth access_token.", async () => {
    // Prepare
    httpRequest.mockResolvedValueOnce({ err: "error" });

    // Execute
    const result = await threads.setAccessToken(data);

    // Verify
    expect(mockGetParams.mock.calls).toEqual([[]]);
    expect(httpRequest.mock.calls).toEqual([httpPostParams]);
    expect(mockUpdateParams).not.toHaveBeenCalled();
    expect(result).toEqual({ err: "POST /oauth/access_token: error" });
  });

  it("should return error, if failed to get access token.", async () => {
    // Prepare
    httpRequest.mockResolvedValueOnce({
      data: { json: () => Promise.resolve({}) },
    });

    // Execute
    const result = await threads.setAccessToken(data);

    // Verify
    expect(mockGetParams.mock.calls).toEqual([[]]);
    expect(httpRequest.mock.calls).toEqual([httpPostParams]);
    expect(mockUpdateParams).not.toHaveBeenCalled();
    expect(result).toEqual({
      err: "POST /oauth/access_token: failed to get access token",
    });
  });

  it("should return error, if failed to get access_token.", async () => {
    // Prepare
    httpRequest
      .mockResolvedValueOnce({
        data: { json: () => Promise.resolve(oauthData) },
      })
      .mockResolvedValueOnce({ err: "error" });

    // Execute
    const result = await threads.setAccessToken(data);

    // Verify
    expect(mockGetParams.mock.calls).toEqual([[]]);
    expect(httpRequest.mock.calls).toEqual([httpPostParams, httpGetParams]);
    expect(mockUpdateParams).not.toHaveBeenCalled();
    expect(result).toEqual({ err: "GET /access_token: error" });
  });

  it("should return error, if failed to get new access_token.", async () => {
    // Prepare
    httpRequest
      .mockResolvedValueOnce({
        data: { json: () => Promise.resolve(oauthData) },
      })
      .mockResolvedValueOnce({
        data: { json: () => Promise.resolve({}) },
      });

    // Execute
    const result = await threads.setAccessToken(data);

    // Verify
    expect(mockGetParams.mock.calls).toEqual([[]]);
    expect(httpRequest.mock.calls).toEqual([httpPostParams, httpGetParams]);
    expect(mockUpdateParams).not.toHaveBeenCalled();
    expect(result).toEqual({
      err: "GET /access_token: failed to get access token",
    });
  });

  it("should return error, if updateDoc returns error.", async () => {
    // Prepare
    httpRequest
      .mockResolvedValueOnce({
        data: { json: () => Promise.resolve(oauthData) },
      })
      .mockResolvedValueOnce({
        data: { json: () => Promise.resolve(tokenData) },
      });
    mockUpdateParams.mockResolvedValueOnce({ err: "error" });

    // Execute
    const result = await threads.setAccessToken(data);

    // Verify
    expect(mockGetParams.mock.calls).toEqual([[]]);
    expect(httpRequest.mock.calls).toEqual([httpPostParams, httpGetParams]);
    expect(mockUpdateParams.mock.calls).toEqual([[updateData]]);
    expect(result).toEqual({ err: "error" });
  });
});
