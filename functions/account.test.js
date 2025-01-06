const { describe, it, expect, afterEach } = require("@jest/globals");

const {
  gateForGroupMembers,
  addAuthUser,
  updateAuthEmail,
  removeAuthUser,
  getAuthUser,
} = require("./account.js");

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
    expect(ret).toEqual({ err: "missing-uid", data: undefined });
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
    expect(ret).toEqual({ err: "missing-user-doc", data: undefined });
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
    expect(ret).toEqual({ err: "permission-denied", data: undefined });
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
      Promise.resolve({ err: undefined, data: "test-result" }),
    );

    // Call
    const ret = await gateForGroupMembers(db, { uid }, group.id, action);

    // Evaluate
    expect(ret).toEqual({ err: undefined, data: "test-result" });
    expect(action.mock.calls).toEqual([[]]);
    expect(db.collection.mock.calls).toEqual([["users"], ["groups"]]);
    expect(doc.mock.calls).toEqual([[uid], [group.id]]);
    expect(get.mock.calls).toEqual([[], []]);
    expect(group.get.mock.calls).toEqual([["users"]]);
  });
});

describe("addAuthUser", () => {
  const uid = "123456";
  const email = "text@example.com";
  const auth = { createUser: jest.fn() };
  const get = jest.fn();
  const doc = jest.fn(() => ({ get }));
  const db = { collection: jest.fn(() => ({ doc })) };

  it("returns 'missing-uid' if uid is missing.", async () => {
    // Prepare

    // Call
    const ret = await addAuthUser(auth, db, "", email);

    // Evaluate
    expect(ret).toEqual({ err: "missing-uid" });
    expect(auth.createUser.mock.calls).toEqual([]);
    expect(db.collection.mock.calls).toEqual([]);
    expect(doc.mock.calls).toEqual([]);
    expect(get.mock.calls).toEqual([]);
  });

  it("returns 'missing-email' if email is missing.", async () => {
    // Prepare

    // Call
    const ret = await addAuthUser(auth, db, uid, "");

    // Evaluate
    expect(ret).toEqual({ err: "missing-email" });
    expect(auth.createUser.mock.calls).toEqual([]);
    expect(db.collection.mock.calls).toEqual([]);
    expect(doc.mock.calls).toEqual([]);
    expect(get.mock.calls).toEqual([]);
  });

  it("returns 'missing-user-doc' if user document is missing.", async () => {
    // Prepare
    const user = { exists: false };
    get.mockImplementationOnce(() => Promise.resolve(user));

    // Call
    const ret = await addAuthUser(auth, db, uid, email);

    // Evaluate
    expect(ret).toEqual({ err: `missing-user-doc ${uid}` });
    expect(auth.createUser.mock.calls).toEqual([]);
    expect(db.collection.mock.calls).toEqual([["users"]]);
    expect(doc.mock.calls).toEqual([[uid]]);
    expect(get.mock.calls).toEqual([[]]);
  });

  it("returns null if all processes are successful.", async () => {
    // Prepare
    const user = { exists: true };
    get.mockImplementationOnce(() => Promise.resolve(user));

    // Call
    const ret = await addAuthUser(auth, db, uid, email);

    // Evaluate
    expect(ret).toEqual({ err: undefined });
    expect(auth.createUser.mock.calls).toEqual([[{ uid, email }]]);
    expect(db.collection.mock.calls).toEqual([["users"]]);
    expect(doc.mock.calls).toEqual([[uid]]);
    expect(get.mock.calls).toEqual([[]]);
  });

  it("returns error if exception occurs in auth.createUser", async () => {
    // Prepare
    const user = { exists: true };
    get.mockImplementationOnce(() => Promise.resolve(user));
    auth.createUser.mockImplementationOnce(() => Promise.reject("test/error"));

    // Call
    const ret = await addAuthUser(auth, db, uid, email);

    // Evaluate
    expect(ret).toEqual({ err: "test/error" });
    expect(auth.createUser.mock.calls).toEqual([[{ uid, email }]]);
    expect(db.collection.mock.calls).toEqual([["users"]]);
    expect(doc.mock.calls).toEqual([[uid]]);
    expect(get.mock.calls).toEqual([[]]);
  });
});

describe("updateAuthEmail", () => {
  const uid = "123456";
  const email = "test@example.com";
  const auth = { updateUser: jest.fn() };

  it("returns 'missing-uid' if uid is missing.", async () => {
    // Prepare

    // Call
    const ret = await updateAuthEmail(auth, "", email);

    // Evaluate
    expect(ret).toEqual({ err: "missing-uid" });
    expect(auth.updateUser.mock.calls).toEqual([]);
  });

  it("returns 'missing-email' if email is missing.", async () => {
    // Prepare

    // Call
    const ret = await updateAuthEmail(auth, uid, "");

    // Evaluate
    expect(ret).toEqual({ err: "missing-email" });
    expect(auth.updateUser.mock.calls).toEqual([]);
  });

  it("returns null if all processes are successful.", async () => {
    // Prepare

    // Call
    const ret = await updateAuthEmail(auth, uid, email);

    // Evaluate
    expect(ret).toEqual({ err: undefined });
    expect(auth.updateUser.mock.calls).toEqual([[uid, { email }]]);
  });

  it("returns error if exception occurs in auth.updateEmail", async () => {
    // Prepare
    auth.updateUser.mockImplementationOnce(() => Promise.reject("test/error"));

    // Call
    const ret = await updateAuthEmail(auth, uid, email);

    // Evaluate
    expect(ret).toEqual({ err: "test/error" });
    expect(auth.updateUser.mock.calls).toEqual([[uid, { email }]]);
  });
});

describe("removeAuthUser", () => {
  const uid = "123456";
  const auth = { deleteUser: jest.fn() };

  it("returns 'missing-uid' if uid is missing.", async () => {
    // Prepare

    // Call
    const ret = await removeAuthUser(auth, "");

    // Evaluate
    expect(ret).toEqual({ err: "missing-uid" });
    expect(auth.deleteUser.mock.calls).toEqual([]);
  });

  it("returns null if all processes are successful.", async () => {
    // Prepare

    // Call
    const ret = await removeAuthUser(auth, uid);

    // Evaluate
    expect(ret).toEqual({ err: undefined });
    expect(auth.deleteUser.mock.calls).toEqual([[uid]]);
  });

  it("returns error if exception occurs in auth.deleteUser", async () => {
    // Prepare
    auth.deleteUser.mockImplementationOnce(() => Promise.reject("test/error"));

    // Call
    const ret = await removeAuthUser(auth, uid);

    // Evaluate
    expect(ret).toEqual({ err: "test/error" });
    expect(auth.deleteUser.mock.calls).toEqual([[uid]]);
  });
});

describe("getAuthUser", () => {
  const uid = "123456";
  const auth = { getUser: jest.fn() };

  it("returns 'missing-uid' if uid is missing.", async () => {
    // Prepare

    // Call
    const ret = await getAuthUser(auth, "");

    // Evaluate
    expect(ret).toEqual({ err: "missing-uid", data: undefined });
    expect(auth.getUser.mock.calls).toEqual([]);
  });

  it("returns user if all processes are successful.", async () => {
    // Prepare
    const user = { uid };
    auth.getUser.mockImplementationOnce(() => Promise.resolve(user));

    // Call
    const ret = await getAuthUser(auth, uid);

    // Evaluate
    expect(ret).toEqual({ err: undefined, data: user });
    expect(auth.getUser.mock.calls).toEqual([[uid]]);
  });

  it("returns null if user is not found.", async () => {
    // Prepare
    auth.getUser.mockImplementationOnce(() =>
      Promise.reject({ code: "auth/user-not-found" }),
    );

    // Call
    const ret = await getAuthUser(auth, uid);

    // Evaluate
    expect(ret).toEqual({ err: undefined, data: null });
    expect(auth.getUser.mock.calls).toEqual([[uid]]);
  });

  it("returns error if exception occurs in auth.getUser", async () => {
    // Prepare
    auth.getUser.mockImplementationOnce(() => Promise.reject("test/error"));

    // Call
    const ret = await getAuthUser(auth, uid);

    // Evaluate
    expect(ret).toEqual({ err: "test/error", data: undefined });
    expect(auth.getUser.mock.calls).toEqual([[uid]]);
  });
});
