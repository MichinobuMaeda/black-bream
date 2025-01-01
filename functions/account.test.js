const { describe, it, expect, afterEach } = require("@jest/globals");

const { gateForGroupMembers, createAuthUser } = require("./account.js");

jest.mock("firebase-functions/logger");

afterEach(() => {
  jest.clearAllMocks();
});

describe("gateForGroupMembers", () => {
  const uid = "123456";
  const action = jest.fn();
  const get = jest.fn();
  const doc = jest.fn(() => ({ get }));
  const db = { collection: jest.fn(() => ({ doc })) };

  it("returns 'missing-uid' if uid is missing.", async () => {
    // Prepare

    // Call
    const ret = await gateForGroupMembers(db, {}, "group-id", action);

    // Evaluate
    expect(ret).toEqual(["missing-uid", undefined]);
    expect(db.collection.mock.calls).toEqual([]);
    expect(doc.mock.calls).toEqual([]);
    expect(get.mock.calls).toEqual([]);
  });

  it("returns 'missing-user-doc' if user document is missing.", async () => {
    // Prepare
    const user = { id: "user-id", exists: false };
    get.mockImplementationOnce(() => Promise.resolve(user));

    // Call
    const ret = await gateForGroupMembers(db, { uid }, "group-id", action);

    // Evaluate
    expect(ret).toEqual(["missing-user-doc", undefined]);
    expect(db.collection.mock.calls).toEqual([["users"]]);
    expect(doc.mock.calls).toEqual([[uid]]);
    expect(get.mock.calls).toEqual([[]]);
  });

  it("returns 'permission-denied' if user is not in the group.", async () => {
    // Prepare
    const user = { id: "user-id", exists: true };
    const group = { id: "group-id", get: jest.fn() };
    get
      .mockImplementationOnce(() => Promise.resolve(user))
      .mockImplementationOnce(() => Promise.resolve(group));
    group.get.mockImplementationOnce(() => ["another-user"]);

    // Call
    const ret = await gateForGroupMembers(db, { uid }, group.id, action);

    // Evaluate
    expect(ret).toEqual(["permission-denied", undefined]);
    expect(db.collection.mock.calls).toEqual([["users"], ["groups"]]);
    expect(doc.mock.calls).toEqual([[uid], [group.id]]);
    expect(get.mock.calls).toEqual([[], []]);
    expect(group.get.mock.calls).toEqual([["users"]]);
  });

  it("returns result of action if all processes are successful.", async () => {
    // Prepare
    const user = { id: "user-id", exists: true };
    const group = { id: "group-id", get: jest.fn() };
    get
      .mockImplementationOnce(() => Promise.resolve(user))
      .mockImplementationOnce(() => Promise.resolve(group));
    group.get.mockImplementationOnce(() => [uid]);
    action.mockImplementationOnce(() =>
      Promise.resolve([undefined, "test-result"]),
    );

    // Call
    const ret = await gateForGroupMembers(db, { uid }, group.id, action);

    // Evaluate
    expect(ret).toEqual([undefined, "test-result"]);
    expect(action.mock.calls).toEqual([[]]);
    expect(db.collection.mock.calls).toEqual([["users"], ["groups"]]);
    expect(doc.mock.calls).toEqual([[uid], [group.id]]);
    expect(get.mock.calls).toEqual([[], []]);
    expect(group.get.mock.calls).toEqual([["users"]]);
  });
});

describe("createAuthUser", () => {
  const uid = "123456";
  const email = "text@example.com";
  const auth = { createUser: jest.fn() };
  const db = { collection: jest.fn() };

  it("returns 'missing-uid' if uid is missing.", async () => {
    // Prepare

    // Call
    const ret = await createAuthUser(auth, db, "", email);

    // Evaluate
    expect(ret).toBe("missing-uid");
    expect(auth.createUser.mock.calls).toEqual([]);
    expect(db.collection.mock.calls).toEqual([]);
  });

  it("returns 'missing-email' if email is missing.", async () => {
    // Prepare

    // Call
    const ret = await createAuthUser(auth, db, uid, "");

    // Evaluate
    expect(ret).toBe("missing-email");
    expect(auth.createUser.mock.calls).toEqual([]);
    expect(db.collection.mock.calls).toEqual([]);
  });

  it("returns null if all processes are successful.", async () => {
    // Prepare

    // Call
    const ret = await createAuthUser(auth, db, uid, email);

    // Evaluate
    expect(ret).toBeNull();
    expect(auth.createUser.mock.calls).toEqual([[{ uid, email }]]);
  });

  it("returns error if exception occurs in auth.createUser", async () => {
    // Prepare
    auth.createUser.mockImplementationOnce(() => Promise.reject("test/error"));

    // Call
    const ret = await createAuthUser(auth, db, uid, email);

    // Evaluate
    expect(ret).toBe("test/error");
    expect(auth.createUser.mock.calls).toEqual([[{ uid, email }]]);
  });
});
