const { describe, it, expect, afterEach } = require("@jest/globals");

const { getDoc, updateDoc } = require("./utils.js");
const { Provider } = require("./provider.js");

jest.mock("./utils.js");

const ref = { get: jest.fn() };
const doc = jest.fn(() => ref);
const db = { collection: jest.fn(() => ({ doc })) };
const bucket = { data: "bucket" };

afterEach(() => {
  jest.clearAllMocks();
});

describe("Provider", () => {
  it("should have property id", () => {
    const provider = new Provider(db, bucket);
    expect(provider.id).toEqual("");
  });

  it("should have property db", () => {
    const provider = new Provider(db, bucket);
    expect(provider.db).toEqual(db);
  });

  it("should have property bucket", () => {
    const provider = new Provider(db, bucket);
    expect(provider.bucket).toEqual(bucket);
  });
});

describe("Provider.getParams", () => {
  const snap = { exists: true, get: jest.fn(() => undefined) };
  getDoc.mockResolvedValue({ err: undefined, data: snap });
  const provider = new Provider(db, bucket);
  provider.id = "target-name";

  it("should return error if getDoc returns error.", async () => {
    // Prepare
    getDoc.mockResolvedValueOnce({ err: "Error" });

    // Execute
    const result = await provider.getParams();

    // Verify
    expect(getDoc.mock.calls).toEqual([[ref]]);
    expect(result).toEqual({ err: "service/auth Error" });
  });

  it("should return error if service/auth does not exist.", async () => {
    // Prepare
    getDoc.mockResolvedValueOnce({ err: undefined, data: { exists: false } });

    // Execute
    const result = await provider.getParams();

    // Verify
    expect(getDoc.mock.calls).toEqual([[ref]]);
    expect(result).toEqual({ err: "service/auth not found" });
  });

  it("should return error if service/auth is deleted.", async () => {
    // Prepare
    snap.get.mockImplementationOnce(() => new Date());

    // Execute
    const result = await provider.getParams();

    // Verify
    expect(getDoc.mock.calls).toEqual([[ref]]);
    expect(snap.get.mock.calls).toEqual([["deletedAt"]]);
    expect(result).toEqual({ err: "service/auth is deleted" });
  });

  it("should return error if service/auth/target-name does not exist.", async () => {
    // Prepare
    snap.get
      .mockImplementationOnce(() => undefined) // deletedAt
      .mockImplementationOnce(() => undefined); // target-name

    // Execute
    const result = await provider.getParams();

    // Verify
    expect(getDoc.mock.calls).toEqual([[ref]]);
    expect(snap.get.mock.calls).toEqual([["deletedAt"], [provider.id]]);
    expect(result).toEqual({ err: "service/auth/target-name not found" });
  });

  it("should return error if service/auth/target-name is deleted.", async () => {
    // Prepare
    snap.get
      .mockImplementationOnce(() => undefined) // deletedAt
      .mockImplementationOnce(() => ({ deletedAt: new Date() })); // target-name

    // Execute
    const result = await provider.getParams();

    // Verify
    expect(getDoc.mock.calls).toEqual([[ref]]);
    expect(snap.get.mock.calls).toEqual([["deletedAt"], [provider.id]]);
    expect(result).toEqual({ err: "service/auth/target-name is deleted" });
  });

  it("should return data", async () => {
    // Prepare
    const data = { key: "value" };
    snap.get
      .mockImplementationOnce(() => undefined) // deletedAt
      .mockImplementationOnce(() => data); // target-name

    // Execute
    const result = await provider.getParams();

    // Verify
    expect(getDoc.mock.calls).toEqual([[ref]]);
    expect(snap.get.mock.calls).toEqual([["deletedAt"], [provider.id]]);
    expect(result).toEqual({ err: undefined, data });
  });
});

describe("Provider.updateParams", () => {
  const data = { key1: "value1", key2: "value2" };
  const update = {
    "target-name.key1": "value1",
    "target-name.key2": "value2",
    updatedAt: expect.any(Date),
  };
  updateDoc.mockResolvedValue({ err: undefined });
  const provider = new Provider(db, bucket);
  provider.id = "target-name";

  it("should return error if updateDoc returns error.", async () => {
    // Prepare
    updateDoc.mockResolvedValueOnce({ err: "Error" });

    // Execute
    const result = await provider.updateParams(data);

    // Verify
    expect(updateDoc.mock.calls).toEqual([[ref, update]]);
    expect(result).toEqual({ err: "service/auth update: Error" });
  });

  it("should return no error.", async () => {
    // Execute
    const result = await provider.updateParams(data);

    // Verify
    expect(updateDoc.mock.calls).toEqual([[ref, update]]);
    expect(result).toEqual({ err: undefined });
  });
});

describe("Provider.post", () => {
  it("should return an empty object.", async () => {
    const provider = new Provider(db, bucket);
    const result = await provider.post({}, "id", {});
    expect(result).toEqual({});
  });
});

describe("Provider.refreshAccessToken", () => {
  it("should return an empty object.", async () => {
    const provider = new Provider(db, bucket);
    const result = await provider.refreshAccessToken();
    expect(result).toEqual({});
  });
});

describe("Provider.setAccessToken", () => {
  it("should return an empty object.", async () => {
    const provider = new Provider(db, bucket);
    const result = await provider.setAccessToken({});
    expect(result).toEqual({});
  });
});
