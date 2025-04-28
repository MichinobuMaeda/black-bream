import { describe, it, expect, afterEach, vi } from "vitest";
import { docRef, getDoc, updateDoc } from "./utils.js";
import { Provider } from "./provider.js";

vi.mock("./utils.js", () => ({
  docRef: vi.fn(),
  getDoc: vi.fn(),
  updateDoc: vi.fn(),
}));
const db = { test: "db" };
const bucket = { data: "bucket" };

afterEach(() => {
  vi.clearAllMocks();
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
  const provider = new Provider(db, bucket);
  provider.id = "target-name";

  it("should return error if getDoc returns error.", async () => {
    // Prepare
    const authRef = { id: "service/auth" };
    docRef.mockReturnValue(authRef);
    const err = new Error("test error");
    getDoc.mockResolvedValueOnce({ err });

    // Execute
    const result = await provider.getParams();

    // Verify
    expect(getDoc.mock.calls).toEqual([[authRef]]);
    expect(result).toEqual({ err });
  });

  it("should return error if service/auth does not exist.", async () => {
    // Prepare
    const authRef = { id: "service/auth" };
    docRef.mockReturnValue(authRef);
    getDoc.mockResolvedValueOnce({ data: { exists: false } });

    // Execute
    const result = await provider.getParams();

    // Verify
    expect(getDoc.mock.calls).toEqual([[authRef]]);
    expect(result).toEqual({ err: new Error("service/auth not found") });
  });

  it("should return error if service/auth is deleted.", async () => {
    // Prepare
    const authRef = { id: "service/auth" };
    docRef.mockReturnValue(authRef);
    const authDoc = { exists: true, get: vi.fn(() => new Date()) };
    getDoc.mockResolvedValueOnce({ data: authDoc });

    // Execute
    const result = await provider.getParams();

    // Verify
    expect(getDoc.mock.calls).toEqual([[authRef]]);
    expect(authDoc.get.mock.calls).toEqual([["deletedAt"]]);
    expect(result).toEqual({ err: new Error("service/auth is deleted") });
  });

  it("should return error if service/auth/target-name does not exist.", async () => {
    // Prepare
    const authRef = { id: "service/auth" };
    docRef.mockReturnValue(authRef);
    const authDoc = { exists: true, get: vi.fn(() => new Date()) };
    authDoc.get
      .mockImplementationOnce(() => undefined) // deletedAt
      .mockImplementationOnce(() => undefined); // target-name
    getDoc.mockResolvedValueOnce({ data: authDoc });

    // Execute
    const result = await provider.getParams();

    // Verify
    expect(getDoc.mock.calls).toEqual([[authRef]]);
    expect(authDoc.get.mock.calls).toEqual([["deletedAt"], [provider.id]]);
    expect(result).toEqual({
      err: new Error("service/auth/target-name not found"),
    });
  });

  it("should return error if service/auth/target-name is deleted.", async () => {
    // Prepare
    const authRef = { id: "service/auth" };
    docRef.mockReturnValue(authRef);
    const authDoc = { exists: true, get: vi.fn(() => new Date()) };
    authDoc.get
      .mockImplementationOnce(() => undefined) // deletedAt
      .mockImplementationOnce(() => ({ deletedAt: new Date() })); // target-name
    getDoc.mockResolvedValueOnce({ data: authDoc });

    // Execute
    const result = await provider.getParams();

    // Verify
    expect(getDoc.mock.calls).toEqual([[authRef]]);
    expect(authDoc.get.mock.calls).toEqual([["deletedAt"], [provider.id]]);
    expect(result).toEqual({
      err: new Error("service/auth/target-name is deleted"),
    });
  });

  it("should return data", async () => {
    // Prepare
    const authRef = { id: "service/auth" };
    docRef.mockReturnValue(authRef);
    const authDoc = { exists: true, get: vi.fn(() => new Date()) };
    const data = { key: "value" };
    authDoc.get
      .mockImplementationOnce(() => undefined) // deletedAt
      .mockImplementationOnce(() => data); // target-name
    getDoc.mockResolvedValueOnce({ data: authDoc });

    // Execute
    const result = await provider.getParams();

    // Verify
    expect(getDoc.mock.calls).toEqual([[authRef]]);
    expect(authDoc.get.mock.calls).toEqual([["deletedAt"], [provider.id]]);
    expect(result).toEqual({ data });
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
    const authRef = { id: "service/auth" };
    docRef.mockReturnValue(authRef);
    const err = new Error("test error");
    updateDoc.mockResolvedValueOnce({ err });

    // Execute
    const result = await provider.updateParams(data);

    // Verify
    expect(updateDoc.mock.calls).toEqual([[authRef, update]]);
    expect(result).toEqual({ err });
  });

  it("should return no error.", async () => {
    // Execute
    const authRef = { id: "service/auth" };
    docRef.mockReturnValue(authRef);
    const result = await provider.updateParams(data);

    // Verify
    expect(updateDoc.mock.calls).toEqual([[authRef, update]]);
    expect(result).toEqual({});
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
