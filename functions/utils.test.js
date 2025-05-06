import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import Readable from "node:stream";
import { getDownloadURL } from "firebase-admin/storage";
import { FieldValue } from "firebase-admin/firestore";
import { BskyAgent } from "@atproto/api";
import sharp from "sharp";
import {
  generateLinkCard,
  getMimeTypes,
  getMediaDownloadUrl,
  getMediaAsUint8Array,
  reduceImageSize,
  getMediaAsBlob,
  httpRequest,
  getPublicMediaUrl,
  sleep,
  docRef,
  getDoc,
  updateDoc,
  handleError,
  handleOnCall,
} from "./utils.js";

vi.mock("firebase-functions/logger");
vi.mock("firebase-admin/storage");
vi.mock("@atproto/api");
vi.mock("sharp");
BskyAgent.prototype.login = vi.fn(() => Promise.resolve());
BskyAgent.prototype.post = vi.fn(() => Promise.resolve());
global.fetch = vi.fn();

const orgPublicPostMediaUrl = process.env.PUBLIC_POST_MEDIA_URL;

beforeEach(() => {
  process.env.PUBLIC_POST_MEDIA_URL = "https://example.com";
});

afterEach(() => {
  vi.clearAllMocks();
  process.env.PUBLIC_POST_MEDIA_URL = orgPublicPostMediaUrl;
});

describe("generateLinkCard", () => {
  it("should returns null, if text includes no url.", async () => {
    // Prepare

    // Execute
    const result = await generateLinkCard("test");

    // Verify
    expect(result).toEqual({ data: null });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("should returns null, if fetch() returns status 404.", async () => {
    // Prepare
    global.fetch.mockResolvedValue({
      status: 404,
    });

    // Execute
    const result = await generateLinkCard("test\nhttps://example.com\ntest");

    // Verify
    expect(result).toEqual({ data: null });
  });

  it("should returns card data, if text includes url. #1", async () => {
    // Prepare
    const text = `<html>
<head>
  <title>Title</title>
  <meta name="description" content="Description">
  <meta property="og:image" content="https://example.com/thumb.jpg">
</head>
</html>`;
    global.fetch.mockResolvedValue({
      status: 200,
      text: () => Promise.resolve(text),
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
    expect(global.fetch.mock.calls).toEqual([["https://example.com"]]);
  });

  it("should returns card data, if text includes url. #2", async () => {
    // Prepare
    const text = `<html>
<head>
  <meta name="twitter:title" content="Title" />
  <meta name="twitter:description" content="Description">
  <meta name="twitter:image" content="https://example.com/thumb.jpg">
</head>
</html>`;

    global.fetch.mockResolvedValue({
      status: 200,
      text: () => Promise.resolve(text),
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
    expect(global.fetch.mock.calls).toEqual([["https://example.com"]]);
  });

  it("should returns card data, if text includes url. #3", async () => {
    // Prepare
    const text = `<html>
<head>
  <meta property="og:title" content="Title" />
  <meta property="og:description" content="Description">
  <meta property="og:image" content="https://example.com/thumb.jpg">
</head>
</html>`;

    global.fetch.mockResolvedValue({
      status: 200,
      text: () => Promise.resolve(text),
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
    expect(global.fetch.mock.calls).toEqual([["https://example.com"]]);
  });

  it("should returns first occurring data.", async () => {
    // Prepare
    const text = `<html>
<head>
  <meta property="og:title" content="Title" />
  <meta name="twitter:title" content="Title #2" />
  <meta property="og:description" content="Description">
  <meta name="twitter:description" content="Description #2">
  <meta property="og:image" content="https://example.com/thumb.jpg">
  <meta name="twitter:image" content="https://example.com/thumb02.jpg">
</head>
</html>`;

    global.fetch.mockResolvedValue({
      status: 200,
      text: () => Promise.resolve(text),
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
    expect(global.fetch.mock.calls).toEqual([["https://example.com"]]);
  });

  it("should returns error, if fetch() throws an exception.", async () => {
    // Prepare
    const err = new Error("test error");
    global.fetch.mockRejectedValue(err);

    // Execute
    const result = await generateLinkCard("test\nhttps://example.com\ntest");

    // Verify
    expect(result).toEqual({ err });
  });
});

describe("getMimeTypes", () => {
  it("should returns MIME-Types retrieved} from HTTP response headers.", () => {
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
    "should returns MIME-Types retrieved} from the file extension," +
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
    "should returns MIME-Types retrieved} from the file extension #1," +
      " if failed to retrieve 'content-type'} from HTTP response headers.",
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
    "should returns MIME-Types retrieved} from the file extension #2," +
      " if failed to retrieve 'content-type'} from HTTP response headers.",
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
    "should returns MIME-Types retrieved} from the file extension #3," +
      " if failed to retrieve 'content-type'} from HTTP response headers.",
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
      " if failed to retrieve MIME-Types} from HTTP response headers" +
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

describe("getMediaDownloadUrl", () => {
  it("should returns download URL based on given id and file name.", async () => {
    // Prepare
    const contents = [new ArrayBuffer(8)];
    const fileRef = { download: vi.fn(() => Promise.resolve(contents)) };
    const bucket = { file: vi.fn(() => fileRef) };
    const id = "test-id";
    const filename = "test-filename";
    const url = "https://example.com/test.jpg";
    getDownloadURL.mockResolvedValue(url);

    // Execute
    const ret = await getMediaDownloadUrl(bucket, id, filename);

    // Verify
    expect(ret).toEqual(url);
    expect(bucket.file.mock.calls).toEqual([
      [`public/posts/${id}/${filename}`],
    ]);
    expect(getDownloadURL.mock.calls).toEqual([[fileRef]]);
  });
});

describe("getMediaAsUint8Array", () => {
  const contents = [new ArrayBuffer(8)];
  const fileRef = { download: vi.fn(() => Promise.resolve(contents)) };
  const bucket = { file: vi.fn(() => fileRef) };
  const id = "test-id";
  const filename = "1.jpg";

  it("should returns uint8array data of the media file.", async () => {
    // Prepare

    // Execute
    const ret = await getMediaAsUint8Array(bucket, id, filename);

    // Verify
    expect(ret).toEqual({ data: new Uint8Array(contents[0]) });
    expect(bucket.file.mock.calls).toEqual([
      [`public/posts/${id}/${filename}`],
    ]);
  });

  it("should returns error, if download() raises an exception.", async () => {
    // Prepare
    fileRef.download.mockRejectedValue("Error");

    // Execute
    const ret = await getMediaAsUint8Array(bucket, id, filename);

    // Verify
    expect(ret).toEqual({ err: "Error", data: undefined });
    expect(bucket.file.mock.calls).toEqual([
      [`public/posts/${id}/${filename}`],
    ]);
  });
});

describe("reduceImageSize", () => {
  it(
    "should returns the original image data," +
      " if the size is less than maxSize.",
    async () => {
      // Prepare
      const image = new Uint8Array(8);
      const maxSize = 16;
      sharp.mockReturnValue({ metadata: () => Promise.resolve({ size: 8 }) });

      // Execute
      const ret = await reduceImageSize(image, maxSize);

      // Verify
      expect(ret).toEqual({ data: image });
      expect(sharp.mock.calls).toEqual([[image]]);
    },
  );

  it(
    "should returns the original image data," +
      " if the size is less than default maxSize.",
    async () => {
      // Prepare
      const image = new Uint8Array(8);
      sharp.mockReturnValue({ metadata: () => Promise.resolve({ size: 999 }) });

      // Execute
      const ret = await reduceImageSize(image);

      // Verify
      expect(ret).toEqual({ data: image });
      expect(sharp.mock.calls).toEqual([[image]]);
    },
  );

  it(
    "should returns the reduced image data," +
      " if the size is greater than maxSize.",
    async () => {
      // Prepare
      const image = new Uint8Array(8);
      const maxSize = 4;
      sharp.mockReturnValue({
        metadata: () => Promise.resolve({ size: 8 }),
        resize: vi.fn().mockReturnThis(),
        toBuffer: vi.fn(() => Promise.resolve(new ArrayBuffer(4))),
      });

      // Execute
      const ret = await reduceImageSize(image, maxSize);

      // Verify
      expect(ret).toEqual({ data: new Uint8Array(4) });
      expect(sharp.mock.calls).toEqual([[image]]);
    },
  );

  it("should returns error, if sharp() raises an exception.", async () => {
    // Prepare
    const err = new Error("test error");
    const image = new Uint8Array(8);
    const maxSize = 4;
    sharp.mockReturnValue({ metadata: () => Promise.reject(err) });

    // Execute
    const ret = await reduceImageSize(image, maxSize);

    // Verify
    expect(ret).toEqual({ err });
    expect(sharp.mock.calls).toEqual([[image]]);
  });
});

describe("getMediaAsBlob", () => {
  const contents = [new ArrayBuffer(8)];
  const fileRef = { download: vi.fn(() => Promise.resolve(contents)) };
  const bucket = { file: vi.fn(() => fileRef) };
  const id = "test-id";
  const filename = "1.jpg";

  it("should returns blob data of the media file.", async () => {
    // Prepare
    sharp.mockReturnValue({ metadata: () => Promise.resolve({ size: 4 }) });

    // Execute
    const ret = await getMediaAsBlob(bucket, id, filename);

    // Verify
    expect(ret).toEqual({
      err: undefined,
      data: new Blob(contents, { type: "image/jpeg" }),
    });
    expect(bucket.file.mock.calls).toEqual([
      [`public/posts/${id}/${filename}`],
    ]);
  });

  it("should returns error, if download() raises an exception.", async () => {
    // Prepare
    fileRef.download.mockRejectedValue("Error");

    // Execute
    const ret = await getMediaAsBlob(bucket, id, filename);

    // Verify
    expect(ret).toEqual({ err: "Error", data: undefined });
    expect(bucket.file.mock.calls).toEqual([
      [`public/posts/${id}/${filename}`],
    ]);
  });

  it("should returns error, if sharp() raises an exception.", async () => {
    // Prepare
    fileRef.download.mockResolvedValue(contents);
    sharp.mockReturnValue({ metadata: () => Promise.reject("Error") });

    // Execute
    const ret = await getMediaAsBlob(bucket, id, filename);

    // Verify
    expect(ret).toEqual({ err: "Error", data: undefined });
    expect(bucket.file.mock.calls).toEqual([
      [`public/posts/${id}/${filename}`],
    ]);
  });
});

describe("httpRequest", () => {
  it("should returns response data.", async () => {
    // Prepare
    const url = "https://example.com";
    const options = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ test: "test" }),
    };
    const resp = { status: 200, json: () => Promise.resolve({ test: "data" }) };
    global.fetch.mockResolvedValue(resp);

    // Execute
    const ret = await httpRequest(url, options);

    // Verify
    expect(ret).toEqual({ data: resp });
    expect(global.fetch.mock.calls).toEqual([[url, options]]);
  });

  it("should returns error, if fetch() raises an exception.", async () => {
    // Prepare
    const url = "https://example.com";
    const options = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ test: "test" }),
    };
    const err = new Error("test error");
    global.fetch.mockRejectedValue(err);

    // Execute
    const ret = await httpRequest(url, options);

    // Verify
    expect(ret).toEqual({ err });
    expect(global.fetch.mock.calls).toEqual([[url, options]]);
  });

  it("should returns error, if response status is not 200.", async () => {
    // Prepare
    const url = "https://example.com";
    const options = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ test: "test" }),
    };
    const resp = { status: 404, statusText: "Not found" };
    global.fetch.mockResolvedValue(resp);

    // Execute
    const ret = await httpRequest(url, options);

    // Verify
    expect(ret).toEqual({ err: new Error("404 Not found") });
    expect(global.fetch.mock.calls).toEqual([[url, options]]);
  });
});

describe("getPublicMediaUrl", () => {
  it("should returns public media URL.", () => {
    // Prepare
    const id = "test-id";
    const file = "test.jpg";

    // Execute
    const ret = getPublicMediaUrl(id, file);

    // Verify
    expect(ret).toEqual(`https://example.com/media/posts/${id}/${file}`);
  });
});

describe("sleep", () => {
  global.setTimeout = vi.fn((r, ms) => r());

  it("should sleep for the specified time.", async () => {
    // Prepare

    // Execute
    await sleep(0.1);

    // Verify
    expect(global.setTimeout.mock.calls).toEqual([[expect.any(Function), 100]]);
  });
});

describe("docRef", () => {
  it("should returns document reference.", () => {
    // Prepare
    const collection = "test-collection";
    const id = "test-id";
    const ref = { test: "test" };
    const collectionRef = { doc: vi.fn(() => ref) };
    const db = { collection: vi.fn(() => collectionRef) };

    // Execute
    const ret = docRef(db, collection, id);

    // Verify
    expect(ret).toEqual(ref);
    expect(db.collection.mock.calls).toEqual([[collection]]);
    expect(collectionRef.doc.mock.calls).toEqual([[id]]);
  });
});

describe("getDoc", () => {
  it("should returns document data.", async () => {
    // Prepare
    const doc = { data: () => ({ test: "data" }) };
    const ref = { get: vi.fn(() => Promise.resolve(doc)) };

    // Execute
    const ret = await getDoc(ref);

    // Verify
    expect(ref.get.mock.calls).toEqual([[]]);
    expect(ret).toEqual({ data: doc });
  });

  it("should returns error, if get() raises an exception.", async () => {
    // Prepare
    const err = new Error("test error");
    const ref = { get: vi.fn(() => Promise.reject(err)) };

    // Execute
    const ret = await getDoc(ref);

    // Verify
    expect(ref.get.mock.calls).toEqual([[]]);
    expect(ret).toEqual({ err });
  });
});

describe("updateDoc", () => {
  it("should update document data.", async () => {
    // Prepare
    const ref = { update: vi.fn(() => Promise.resolve({})) };
    const data = { test: "data" };

    // Execute
    const ret = await updateDoc(ref, data);

    // Verify
    expect(ref.update.mock.calls).toEqual([[data]]);
    expect(ret).toEqual({});
  });

  it("should returns error, if update() raises an exception.", async () => {
    // Prepare
    const err = new Error("test error");
    const ref = { update: vi.fn(() => Promise.reject(err)) };
    const data = { test: "data" };

    // Execute
    const ret = await updateDoc(ref, data);

    // Verify
    expect(ref.update.mock.calls).toEqual([[data]]);
    expect(ret).toEqual({ err });
  });
});

describe("handleError", () => {
  it("should not record error, if f() returns no error.", async () => {
    // Prepare
    const add = vi.fn(() => Promise.resolve({}));
    const db = { collection: vi.fn(() => ({ add })) };
    const data = { data: "test" };
    const f = vi.fn(() => Promise.resolve(data));

    // Execute
    const ret = await handleError(db)(f());

    // Verify
    expect(f.mock.calls).toEqual([[]]);
    expect(db.collection).not.toHaveBeenCalled();
    expect(add).not.toHaveBeenCalled();
    expect(ret).toEqual(data);
  });

  it("should record error, if f() returns an error.", async () => {
    // Prepare
    const add = vi.fn(() => Promise.resolve({}));
    const db = { collection: vi.fn(() => ({ add })) };
    const data = { err: "test" };
    const f = vi.fn(() => Promise.resolve(data));

    // Execute
    const ret = await handleError(db)(f());

    // Verify
    expect(f.mock.calls).toEqual([[]]);
    expect(db.collection.mock.calls).toEqual([["logs"]]);
    expect(add.mock.calls).toEqual([
      [
        {
          level: "error",
          message: "test",
          stack: "",
          createdAt: FieldValue.serverTimestamp,
        },
      ],
    ]);
    expect(ret).toEqual(data);
  });

  it("should record error, if f() returns an empty error.", async () => {
    // Prepare
    const add = vi.fn(() => Promise.resolve({}));
    const db = { collection: vi.fn(() => ({ add })) };
    const data = { err: "" };
    const f = vi.fn(() => Promise.resolve(data));

    // Execute
    const ret = await handleError(db)(f());

    // Verify
    expect(f.mock.calls).toEqual([[]]);
    expect(db.collection.mock.calls).toEqual([["logs"]]);
    expect(add.mock.calls).toEqual([
      [
        {
          level: "error",
          message: "Unknown error",
          stack: "",
          createdAt: FieldValue.serverTimestamp,
        },
      ],
    ]);
    expect(ret).toEqual(data);
  });

  it("should record error, if f() raises an error.", async () => {
    // Prepare
    const add = vi.fn(() => Promise.resolve({}));
    const db = { collection: vi.fn(() => ({ add })) };
    const err = new Error("test error");
    const f = vi.fn(() => Promise.reject(err));

    // Execute
    const ret = await handleError(db)(f());

    // Verify
    expect(f.mock.calls).toEqual([[]]);
    expect(db.collection.mock.calls).toEqual([["logs"]]);
    expect(add.mock.calls).toEqual([
      [
        {
          level: "error",
          message: err.message,
          stack: err.stack,
          createdAt: FieldValue.serverTimestamp,
        },
      ],
    ]);
    expect(ret).toEqual({ err: err.toString() });
  });
});

describe("handleOnCall", () => {
  it("should call f() and record log.", async () => {
    // Prepare
    const add = vi.fn(() => Promise.resolve({}));
    const db = { collection: vi.fn(() => ({ add })) };
    const name = "testFunction";
    const uid = "test-uid";
    const params = { param: "test" };
    const f = vi.fn(() => Promise.resolve({ data: "test" }));

    // Execute
    const ret = await handleOnCall(db)(name, { uid }, params, f());

    // Verify
    expect(f.mock.calls).toEqual([[]]);
    expect(db.collection.mock.calls).toEqual([["logs"]]);
    expect(add.mock.calls).toEqual([
      [
        {
          level: "info",
          message: `${uid} calls ${name} with ${JSON.stringify(params)}`,
          createdAt: FieldValue.serverTimestamp,
        },
      ],
    ]);
    expect(ret).toEqual({ data: "test" });
  });

  it("should record error, if f() returns an error.", async () => {
    // Prepare
    const add = vi.fn(() => Promise.resolve({}));
    const db = { collection: vi.fn(() => ({ add })) };
    const name = "testFunction";
    const uid = "test-uid";
    const params = { param: "test" };
    const data = { err: "test" };
    const f = vi.fn(() => Promise.resolve(data));

    // Execute
    const ret = await handleOnCall(db)(name, { uid }, params, f());

    // Verify
    expect(f.mock.calls).toEqual([[]]);
    expect(db.collection.mock.calls).toEqual([["logs"], ["logs"]]);
    expect(add.mock.calls).toEqual([
      [
        {
          level: "info",
          message: `${uid} calls ${name} with ${JSON.stringify(params)}`,
          createdAt: FieldValue.serverTimestamp,
        },
      ],
      [
        {
          level: "error",
          message: "test",
          stack: "",
          createdAt: FieldValue.serverTimestamp,
        },
      ],
    ]);
    expect(ret).toEqual(data);
  });

  it("should record error, if db.collection('logs').add() occurs an error", async () => {
    // Prepare
    const add = vi.fn();
    const err = new Error("test error");
    add.mockRejectedValueOnce(err).mockResolvedValueOnce({});
    const db = { collection: vi.fn(() => ({ add })) };
    const name = "testFunction";
    const uid = "test-uid";
    const params = { param: "test" };
    const data = { data: "test" };
    const f = vi.fn(() => Promise.resolve(data));

    // Execute
    const ret = await handleOnCall(db)(name, { uid }, params, f());

    // Verify
    expect(f.mock.calls).toEqual([[]]);
    expect(db.collection.mock.calls).toEqual([["logs"], ["logs"]]);
    expect(add.mock.calls).toEqual([
      [
        {
          level: "info",
          message: `${uid} calls ${name} with ${JSON.stringify(params)}`,
          createdAt: FieldValue.serverTimestamp,
        },
      ],
      [
        {
          level: "error",
          message: "test error",
          stack: err.stack,
          createdAt: FieldValue.serverTimestamp,
        },
      ],
    ]);
    expect(ret).toEqual({ err: err.toString() });
  });
});
