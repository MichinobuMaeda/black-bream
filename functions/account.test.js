import { describe, it, expect, afterEach, vi } from "vitest";
import { docRef, getDoc } from "./utils.js";
import {
  gateForGroupMembers,
  addAuthUser,
  updateAuthEmail,
  removeAuthUser,
  getAuthUser,
} from "./account.js";

vi.mock("firebase-functions/logger");
vi.mock("./utils.js", () => ({
  docRef: vi.fn(),
  getDoc: vi.fn(),
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe("gateForGroupMembers", () => {
  const db = { test: "db" };
  const uid = "123456";
  const gid = "group-id";
  const action = vi.fn();

  it("should returns 'missing-uid' if uid is missing.", async () => {
    // Prepare

    // Execute
    const ret = await gateForGroupMembers(db, {}, gid, action);

    // Verify
    expect(ret).toEqual({ err: new Error("missing-uid") });
    expect(docRef).not.toHaveBeenCalled();
    expect(getDoc).not.toHaveBeenCalled();
    expect(action).not.toHaveBeenCalled();
  });

  it("should returns error if getDoc(db, 'users', uid) returns error.", async () => {
    // Prepare
    const userRef = { id: uid };
    docRef.mockReturnValueOnce(userRef);
    const err = new Error("test/error");
    getDoc.mockResolvedValueOnce({ err });

    // Execute
    const ret = await gateForGroupMembers(db, { uid }, gid, action);

    // Verify
    expect(ret).toEqual({ err });
    expect(docRef.mock.calls).toEqual([[db, "users", uid]]);
    expect(getDoc.mock.calls).toEqual([[userRef]]);
    expect(action).not.toHaveBeenCalled();
  });

  it("should returns 'missing-user-doc' if user document is missing.", async () => {
    // Prepare
    const userRef = { id: uid };
    docRef.mockReturnValueOnce(userRef);
    const user = { id: uid, exists: false };
    getDoc.mockResolvedValueOnce({ data: user });

    // Execute
    const ret = await gateForGroupMembers(db, { uid }, gid, action);

    // Verify
    expect(ret).toEqual({ err: new Error("missing-user-doc") });
    expect(docRef.mock.calls).toEqual([[db, "users", uid]]);
    expect(getDoc.mock.calls).toEqual([[userRef]]);
    expect(action).not.toHaveBeenCalled();
  });

  it("should returns error if getDoc(db, 'groups', gid) returns error.", async () => {
    // Prepare
    const userRef = { id: uid };
    const groupRef = { id: gid };
    docRef.mockReturnValueOnce(userRef).mockReturnValueOnce(groupRef);
    const user = { id: uid, exists: true };
    const err = new Error("test/error");
    getDoc.mockResolvedValueOnce({ data: user }).mockResolvedValueOnce({ err });

    // Execute
    const ret = await gateForGroupMembers(db, { uid }, gid, action);

    // Verify
    expect(ret).toEqual({ err });
    expect(docRef.mock.calls).toEqual([
      [db, "users", uid],
      [db, "groups", gid],
    ]);
    expect(getDoc.mock.calls).toEqual([[userRef], [groupRef]]);
    expect(action).not.toHaveBeenCalled();
  });

  it("should returns 'permission-denied' if user is not in the group.", async () => {
    // Prepare
    const userRef = { id: uid };
    const groupRef = { id: gid };
    docRef.mockReturnValueOnce(userRef).mockReturnValueOnce(groupRef);
    const user = { id: uid, exists: true };
    const group = { id: gid, get: vi.fn() };
    getDoc.mockResolvedValueOnce({ data: user }).mockResolvedValueOnce({
      data: group,
    });
    group.get.mockImplementationOnce(() => ["other-user-id"]);

    // Execute
    const ret = await gateForGroupMembers(db, { uid }, group.id, action);

    // Verify
    expect(ret).toEqual({ err: new Error("permission-denied") });
    expect(docRef.mock.calls).toEqual([
      [db, "users", uid],
      [db, "groups", group.id],
    ]);
    expect(getDoc.mock.calls).toEqual([[userRef], [groupRef]]);
    expect(action).not.toHaveBeenCalled();
    expect(group.get.mock.calls).toEqual([["users"]]);
  });

  it("should returns result of action if all processes are successful.", async () => {
    // Prepare
    const userRef = { id: uid };
    const groupRef = { id: gid };
    docRef.mockReturnValueOnce(userRef).mockReturnValueOnce(groupRef);
    const user = { id: uid, exists: true };
    const group = { id: gid, get: vi.fn() };
    getDoc.mockResolvedValueOnce({ data: user }).mockResolvedValueOnce({
      data: group,
    });
    group.get.mockImplementationOnce(() => [uid]);
    action.mockResolvedValueOnce({ data: "test-result" });

    // Execute
    const ret = await gateForGroupMembers(db, { uid }, group.id, action);

    // Verify
    expect(ret).toEqual({ data: "test-result" });
    expect(docRef.mock.calls).toEqual([
      [db, "users", uid],
      [db, "groups", group.id],
    ]);
    expect(getDoc.mock.calls).toEqual([[userRef], [groupRef]]);
    expect(action.mock.calls).toEqual([[]]);
    expect(group.get.mock.calls).toEqual([["users"]]);
  });
});

describe("addAuthUser", () => {
  const db = { test: "db" };
  const uid = "123456";
  const email = "text@example.com";
  const auth = { createUser: vi.fn() };

  it("should returns 'missing-uid' if uid is missing.", async () => {
    // Prepare

    // Execute
    const ret = await addAuthUser(auth, db, "", email);

    // Verify
    expect(ret).toEqual({ err: new Error("missing-uid") });
    expect(docRef).not.toHaveBeenCalled();
    expect(getDoc).not.toHaveBeenCalled();
    expect(auth.createUser).not.toHaveBeenCalled();
  });

  it("should returns 'missing-email' if email is missing.", async () => {
    // Prepare

    // Execute
    const ret = await addAuthUser(auth, db, uid, "");

    // Verify
    expect(ret).toEqual({ err: new Error("missing-email") });
    expect(docRef).not.toHaveBeenCalled();
    expect(getDoc).not.toHaveBeenCalled();
    expect(auth.createUser).not.toHaveBeenCalled();
  });

  it("should returns 'missing-user-doc' if user document is missing.", async () => {
    // Prepare
    const userRef = { id: uid };
    const user = { exists: false };
    docRef.mockReturnValueOnce(userRef);
    getDoc.mockResolvedValueOnce({ data: user });

    // Execute
    const ret = await addAuthUser(auth, db, uid, email);

    // Verify
    expect(ret).toEqual({ err: new Error(`missing-user-doc ${uid}`) });
    expect(docRef.mock.calls).toEqual([[db, "users", uid]]);
    expect(getDoc.mock.calls).toEqual([[userRef]]);
    expect(auth.createUser).not.toHaveBeenCalled();
  });

  it("should returns error if getDoc(db, 'users', uid) returns error.", async () => {
    // Prepare
    const userRef = { id: uid };
    docRef.mockReturnValueOnce(userRef);
    const err = new Error("test/error");
    getDoc.mockResolvedValueOnce({ err });

    // Execute
    const ret = await addAuthUser(auth, db, uid, email);

    // Verify
    expect(ret).toEqual({ err });
    expect(docRef.mock.calls).toEqual([[db, "users", uid]]);
    expect(getDoc.mock.calls).toEqual([[userRef]]);
    expect(auth.createUser).not.toHaveBeenCalled();
  });

  it("should returns error if exception occurs in auth.createUser", async () => {
    // Prepare
    const userRef = { id: uid };
    const user = { exists: true };
    docRef.mockReturnValueOnce(userRef);
    getDoc.mockResolvedValueOnce({ data: user });
    const err = new Error("test/error");
    auth.createUser.mockRejectedValueOnce(err);

    // Execute
    const ret = await addAuthUser(auth, db, uid, email);

    // Verify
    expect(ret).toEqual({ err });
    expect(docRef.mock.calls).toEqual([[db, "users", uid]]);
    expect(getDoc.mock.calls).toEqual([[userRef]]);
    expect(auth.createUser.mock.calls).toEqual([[{ uid, email }]]);
  });

  it("should returns no error if all processes are successful.", async () => {
    // Prepare
    const userRef = { id: uid };
    const user = { exists: true };
    docRef.mockReturnValueOnce(userRef);
    getDoc.mockResolvedValueOnce({ data: user });
    auth.createUser.mockResolvedValueOnce({});

    // Execute
    const ret = await addAuthUser(auth, db, uid, email);

    // Verify
    expect(ret).toEqual({});
    expect(docRef.mock.calls).toEqual([[db, "users", uid]]);
    expect(getDoc.mock.calls).toEqual([[userRef]]);
    expect(auth.createUser.mock.calls).toEqual([[{ uid, email }]]);
  });
});

describe("updateAuthEmail", () => {
  const uid = "123456";
  const email = "text@example.com";
  const auth = { updateUser: vi.fn() };

  it("should returns 'missing-uid' if uid is missing.", async () => {
    // Prepare

    // Execute
    const ret = await updateAuthEmail(auth, "", email);

    // Verify
    expect(ret).toEqual({ err: new Error("missing-uid") });
    expect(auth.updateUser).not.toHaveBeenCalled();
  });

  it("should returns 'missing-email' if email is missing.", async () => {
    // Prepare

    // Execute
    const ret = await updateAuthEmail(auth, uid, "");

    // Verify
    expect(ret).toEqual({ err: new Error("missing-email") });
    expect(auth.updateUser).not.toHaveBeenCalled();
  });

  it("should returns error if exception occurs in auth.updateAuthEmail", async () => {
    // Prepare
    const err = new Error("test/error");
    auth.updateUser.mockRejectedValueOnce(err);

    // Execute
    const ret = await updateAuthEmail(auth, uid, email);

    // Verify
    expect(ret).toEqual({ err });
    expect(auth.updateUser.mock.calls).toEqual([[uid, { email }]]);
  });

  it("should returns no error if all processes are successful.", async () => {
    // Prepare
    auth.updateUser.mockResolvedValueOnce({});

    // Execute
    const ret = await updateAuthEmail(auth, uid, email);

    // Verify
    expect(ret).toEqual({});
    expect(auth.updateUser.mock.calls).toEqual([[uid, { email }]]);
  });
});

describe("removeAuthUser", () => {
  const uid = "123456";
  const auth = { deleteUser: vi.fn() };

  it("should returns 'missing-uid' if uid is missing.", async () => {
    // Prepare

    // Execute
    const ret = await removeAuthUser(auth, "");

    // Verify
    expect(ret).toEqual({ err: new Error("missing-uid") });
    expect(auth.deleteUser).not.toHaveBeenCalled();
  });

  it("should returns error if exception occurs in auth.deleteUser", async () => {
    // Prepare
    auth.deleteUser.mockRejectedValueOnce(new Error("test/error"));

    // Execute
    const ret = await removeAuthUser(auth, uid);

    // Verify
    expect(ret).toEqual({ err: new Error("test/error") });
    expect(auth.deleteUser.mock.calls).toEqual([[uid]]);
  });

  it("should returns null if all processes are successful.", async () => {
    // Prepare
    auth.deleteUser.mockResolvedValueOnce();

    // Execute
    const ret = await removeAuthUser(auth, uid);

    // Verify
    expect(ret).toEqual({ err: undefined });
    expect(auth.deleteUser.mock.calls).toEqual([[uid]]);
  });
});

describe("getAuthUser", () => {
  const uid = "123456";
  const auth = { getUser: vi.fn() };

  it("should returns 'missing-uid' if uid is missing.", async () => {
    // Prepare

    // Execute
    const ret = await getAuthUser(auth, "");

    // Verify
    expect(ret).toEqual({ err: new Error("missing-uid") });
    expect(auth.getUser).not.toHaveBeenCalled();
  });

  it("should returns user if all processes are successful.", async () => {
    // Prepare
    const user = { uid };
    auth.getUser.mockResolvedValueOnce(user);

    // Execute
    const ret = await getAuthUser(auth, uid);

    // Verify
    expect(ret).toEqual({ data: user });
    expect(auth.getUser.mock.calls).toEqual([[uid]]);
  });

  it("should returns null if user is not found.", async () => {
    // Prepare
    auth.getUser.mockRejectedValueOnce({ code: "auth/user-not-found" });

    // Execute
    const ret = await getAuthUser(auth, uid);

    // Verify
    expect(ret).toEqual({ data: null });
    expect(auth.getUser.mock.calls).toEqual([[uid]]);
  });

  it("should returns error if exception occurs in auth.getUser", async () => {
    // Prepare
    auth.getUser.mockRejectedValueOnce(new Error("test/error"));

    // Execute
    const ret = await getAuthUser(auth, uid);

    // Verify
    expect(ret).toEqual({ err: new Error("test/error") });
    expect(auth.getUser.mock.calls).toEqual([[uid]]);
  });
});
