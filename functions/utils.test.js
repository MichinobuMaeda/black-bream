const { describe, it, expect, afterEach } = require("@jest/globals");
const Readable = require("stream").Readable;
const axios = require("axios");
const { BskyAgent } = require("@atproto/api");

const { generateLinkCard, getMimeTypes } = require("./utils.js");

jest.mock("firebase-functions/logger");
jest.mock("axios");
jest.mock("@atproto/api");
BskyAgent.prototype.login = jest.fn(() => Promise.resolve());
BskyAgent.prototype.post = jest.fn(() => Promise.resolve());

afterEach(() => {
  jest.clearAllMocks();
});

describe("generateLinkCard", () => {
  it("should returns null, if text includes no url.", async () => {
    // Prepare

    // Execute
    const result = await generateLinkCard("test");

    // Verify
    expect(result).toEqual({
      err: undefined,
      data: null,
    });
    expect(axios.get).not.toHaveBeenCalled();
  });

  it("should returns null, if axios.get() returns status 404.", async () => {
    // Prepare
    axios.get.mockResolvedValue({
      status: 404,
      data: null,
    });

    // Execute
    const result = await generateLinkCard("test\nhttps://example.com\ntest");

    // Verify
    expect(result).toEqual({
      err: undefined,
      data: null,
    });
  });

  it("should returns card data, if text includes url. #1", async () => {
    // Prepare
    const data = new Readable();
    data._read = () => {};
    data.push(`<html>
<head>
  <title>Title</title>
  <meta name="description" content="Description">
  <meta property="og:image" content="https://example.com/thumb.jpg">
</head>
</html>`);
    data.push(null);

    axios.get.mockResolvedValue({
      status: 200,
      data,
    });

    // Execute
    const result = await generateLinkCard("test\nhttps://example.com\ntest");

    // Verify
    expect(result).toEqual({
      err: undefined,
      data: {
        uri: "https://example.com",
        title: "Title",
        description: "Description",
        thumbUrl: "https://example.com/thumb.jpg",
      },
    });
    expect(axios.get.mock.calls).toEqual([
      [
        "https://example.com",
        {
          responseType: "stream",
        },
      ],
    ]);
  });

  it("should returns card data, if text includes url. #2", async () => {
    // Prepare
    const data = new Readable();
    data._read = () => {};
    data.push(`<html>
<head>
  <meta name="twitter:title" content="Title" />
  <meta name="twitter:description" content="Description">
  <meta name="twitter:image" content="https://example.com/thumb.jpg">
</head>
</html>`);
    data.push(null);

    axios.get.mockResolvedValue({
      status: 200,
      data,
    });

    // Execute
    const result = await generateLinkCard("test\nhttps://example.com\ntest");

    // Verify
    expect(result).toEqual({
      err: undefined,
      data: {
        uri: "https://example.com",
        title: "Title",
        description: "Description",
        thumbUrl: "https://example.com/thumb.jpg",
      },
    });
    expect(axios.get.mock.calls).toEqual([
      [
        "https://example.com",
        {
          responseType: "stream",
        },
      ],
    ]);
  });

  it("should returns card data, if text includes url. #3", async () => {
    // Prepare
    const data = new Readable();
    data._read = () => {};
    data.push(`<html>
<head>
  <meta property="og:title" content="Title" />
  <meta property="og:description" content="Description">
  <meta property="og:image" content="https://example.com/thumb.jpg">
</head>
</html>`);
    data.push(null);

    axios.get.mockResolvedValue({
      status: 200,
      data,
    });

    // Execute
    const result = await generateLinkCard("test\nhttps://example.com\ntest");

    // Verify
    expect(result).toEqual({
      err: undefined,
      data: {
        uri: "https://example.com",
        title: "Title",
        description: "Description",
        thumbUrl: "https://example.com/thumb.jpg",
      },
    });
    expect(axios.get.mock.calls).toEqual([
      [
        "https://example.com",
        {
          responseType: "stream",
        },
      ],
    ]);
  });

  it("should returns first occurring data.", async () => {
    // Prepare
    const data = new Readable();
    data._read = () => {};
    data.push(`<html>
<head>
  <meta property="og:title" content="Title" />
  <meta name="twitter:title" content="Title #2" />
  <meta property="og:description" content="Description">
  <meta name="twitter:description" content="Description #2">
  <meta property="og:image" content="https://example.com/thumb.jpg">
  <meta name="twitter:image" content="https://example.com/thumb02.jpg">
</head>
</html>`);
    data.push(null);

    axios.get.mockResolvedValue({
      status: 200,
      data,
    });

    // Execute
    const result = await generateLinkCard("test\nhttps://example.com\ntest");

    // Verify
    expect(result).toEqual({
      err: undefined,
      data: {
        uri: "https://example.com",
        title: "Title",
        description: "Description",
        thumbUrl: "https://example.com/thumb.jpg",
      },
    });
    expect(axios.get.mock.calls).toEqual([
      [
        "https://example.com",
        {
          responseType: "stream",
        },
      ],
    ]);
  });

  it("should returns error, if axios.get() throws an exception.", async () => {
    // Prepare
    axios.get.mockRejectedValue("test error");

    // Execute
    const result = await generateLinkCard("test\nhttps://example.com\ntest");

    // Verify
    expect(result).toEqual({
      err: "test error",
      data: undefined,
    });
  });
});

describe("getMimeTypes", () => {
  it("should returns MIME-Types retrieved from HTTP response headers.", () => {
    // Prepare
    const url = "https://www.iana.org/_img/2021/iana-logo-header.jpeg";
    const headers = {
      "content-type": "image/svg+xml",
    };

    // Execute
    const result = getMimeTypes(url, headers);

    // Verify
    expect(result).toEqual("image/svg+xml");
  });

  it(
    "should returns MIME-Types retrieved from the file extension," +
      " if HTTP response headers is not set.",
    () => {
      // Prepare
      const url = "https://www.iana.org/_img/2021/iana-logo-header.jpeg";

      // Execute
      const result = getMimeTypes(url);

      // Verify
      expect(result).toEqual("image/jpeg");
    },
  );

  it(
    "should returns MIME-Types retrieved from the file extension #1," +
      " if failed to retrieve 'content-type' from HTTP response headers.",
    () => {
      // Prepare
      const url = "https://www.iana.org/_img/2021/iana-logo-header.jpeg";
      const headers = {};

      // Execute
      const result = getMimeTypes(url, headers);

      // Verify
      expect(result).toEqual("image/jpeg");
    },
  );

  it(
    "should returns MIME-Types retrieved from the file extension #2," +
      " if failed to retrieve 'content-type' from HTTP response headers.",
    () => {
      // Prepare
      const url = "https://www.iana.org/_img/2021/index.html#abc";
      const headers = {};

      // Execute
      const result = getMimeTypes(url, headers);

      // Verify
      expect(result).toEqual("text/html");
    },
  );

  it(
    "should returns MIME-Types retrieved from the file extension #3," +
      " if failed to retrieve 'content-type' from HTTP response headers.",
    () => {
      // Prepare
      const url =
        "https://www.iana.org/_img/2021/iana-logo-header.jpeg?query=1";
      const headers = {};

      // Execute
      const result = getMimeTypes(url, headers);

      // Verify
      expect(result).toEqual("image/jpeg");
    },
  );

  it(
    "should returns 'application/octet-stream'," +
      " if failed to retrieve MIME-Types from HTTP response headers" +
      " and the file extension.",
    () => {
      // Prepare
      const url = "https://www.iana.org/_img/2021/";
      const headers = {};

      // Execute
      const result = getMimeTypes(url, headers);

      // Verify
      expect(result).toEqual("application/octet-stream");
    },
  );
});
