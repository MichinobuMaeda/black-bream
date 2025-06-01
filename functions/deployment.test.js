import { describe, it, expect, afterEach, vi } from "vitest";
import { FieldValue } from "firebase-admin/firestore";
import { addAuthUser } from "./account.js";
import { updateDataV1, updateDataV2, updateDataV3 } from "./deployment.js";

vi.mock("firebase-functions/logger");
vi.mock("./account.js");

afterEach(() => {
  vi.clearAllMocks();
});

describe("updateDataV1", () => {
  const uid = "123456";
  const email = "test@example.com";
  const auth = { getUser: vi.fn(), updateUser: vi.fn() };
  const get = vi.fn();
  const add = vi.fn();
  const set = vi.fn();
  const doc = vi.fn(() => ({ get, set }));
  const db = { collection: vi.fn(() => ({ doc, add })) };
  const conf = {
    exists: true,
    id: "conf",
    get: vi.fn(),
  };
  const deleted = {
    id: "dataVersion",
    exists: true,
    get: vi.fn(),
    ref: { set: vi.fn() },
  };
  const webAppUrl = process.env.WEB_APP_URL;
  const autoSendEmail = process.env.AUTO_SEND_EMAIL;
  const createdAt = FieldValue.serverTimestamp();
  const updatedAt = FieldValue.serverTimestamp();

  it("should update data ver.0 to ver.1.", async () => {
    // Prepare
    deleted.get
      .mockImplementationOnce(() => 0)
      .mockImplementationOnce(() => email);
    add.mockImplementationOnce(() => ({ id: uid }));
    addAuthUser.mockImplementationOnce(() => ({}));

    // Call
    let result = await updateDataV1(auth, db, deleted);

    // Verify
    expect(result).toEqual({ data: 1 });
    expect(db.collection.mock.calls).toEqual([
      ["service"],
      ["users"],
      ["groups"],
      ["groups"],
      ["groups"],
    ]);
    expect(doc.mock.calls).toEqual([
      [conf.id],
      ["admins"],
      ["managers"],
      ["operators"],
    ]);
    expect(set.mock.calls).toEqual([
      [
        {
          desc: expect.stringMatching(/## Privacy Policy/),
          webAppUrl,
          autoSendEmail,
          createdAt,
          updatedAt,
        },
      ],
      [
        {
          name: "System Administrators",
          users: [uid],
          createdAt,
          updatedAt,
        },
      ],
      [
        {
          name: "Managers",
          users: [uid],
          createdAt,
          updatedAt,
        },
      ],
      [
        {
          name: "Operators",
          users: [uid],
          createdAt,
          updatedAt,
        },
      ],
    ]);
    expect(add.mock.calls).toEqual([
      [
        {
          name: "Primary User",
          createdAt,
          updatedAt,
        },
      ],
    ]);
    expect(addAuthUser.mock.calls).toEqual([[auth, db, uid, email]]);
    expect(deleted.ref.set.mock.calls).toEqual([
      [
        {
          ver: 1,
          err: null,
          updatedAt,
        },
      ],
    ]);
  });

  it("should return error if email is missing.", async () => {
    // Prepare
    deleted.get
      .mockImplementationOnce(() => 0)
      .mockImplementationOnce(() => undefined);

    // Call
    let result = await updateDataV1(auth, db, deleted);

    // Verify
    expect(result).toEqual({ err: new Error("missing-email"), data: 0 });
    expect(db.collection).not.toHaveBeenCalled();
    expect(doc).not.toHaveBeenCalled();
    expect(set).not.toHaveBeenCalled();
    expect(add).not.toHaveBeenCalled();
    expect(addAuthUser).not.toHaveBeenCalled();
    expect(deleted.ref.set).not.toHaveBeenCalled();
  });

  it("should return error if set returns error.", async () => {
    // Prepare
    deleted.get
      .mockImplementationOnce(() => 0)
      .mockImplementationOnce(() => email);
    const err = new Error("test error");
    set.mockRejectedValueOnce(err);

    // Call
    let result = await updateDataV1(auth, db, deleted);

    // Verify
    expect(result).toEqual({ err, data: 0 });
    expect(db.collection.mock.calls).toEqual([["service"]]);
    expect(doc.mock.calls).toEqual([[conf.id]]);
    expect(set.mock.calls).toEqual([
      [
        {
          desc: expect.stringMatching(/## Privacy Policy/),
          webAppUrl,
          autoSendEmail,
          createdAt,
          updatedAt,
        },
      ],
    ]);
    expect(add).not.toHaveBeenCalled();
    expect(addAuthUser).not.toHaveBeenCalled();
    expect(deleted.ref.set).not.toHaveBeenCalled();
  });

  it("should return error if addAuthUser returns error.", async () => {
    // Prepare
    deleted.get
      .mockImplementationOnce(() => 0)
      .mockImplementationOnce(() => email);
    add.mockImplementationOnce(() => ({ id: uid }));
    const err = new Error("test error");
    addAuthUser.mockImplementationOnce(() => ({ err }));

    // Call
    let result = await updateDataV1(auth, db, deleted);

    // Verify
    expect(result).toEqual({ err, data: 0 });
    expect(db.collection.mock.calls).toEqual([["service"], ["users"]]);
    expect(doc.mock.calls).toEqual([[conf.id]]);
    expect(set.mock.calls).toEqual([
      [
        {
          desc: expect.stringMatching(/## Privacy Policy/),
          webAppUrl,
          autoSendEmail,
          createdAt,
          updatedAt,
        },
      ],
    ]);
    expect(add.mock.calls).toEqual([
      [
        {
          name: "Primary User",
          createdAt,
          updatedAt,
        },
      ],
    ]);
    expect(addAuthUser.mock.calls).toEqual([[auth, db, uid, email]]);
    expect(deleted.ref.set).not.toHaveBeenCalled();
  });

  it("should not update data of ver.1.", async () => {
    // Prepare
    deleted.get.mockImplementationOnce(() => 1);

    // Call
    let result = await updateDataV1(auth, db, deleted);

    // Verify
    expect(result).toEqual({ data: 1 });
    expect(db.collection).not.toHaveBeenCalled();
    expect(doc).not.toHaveBeenCalled();
    expect(set).not.toHaveBeenCalled();
    expect(add).not.toHaveBeenCalled();
    expect(addAuthUser).not.toHaveBeenCalled();
    expect(deleted.ref.set).not.toHaveBeenCalled();
  });
});

describe("updateDataV2", () => {
  const get = vi.fn();
  const add = vi.fn();
  const set = vi.fn();
  const doc = vi.fn(() => ({ get, set }));
  const db = { collection: vi.fn(() => ({ doc, add })) };
  const deleted = {
    id: "dataVersion",
    exists: true,
    get: vi.fn(),
    ref: { set: vi.fn() },
  };
  const createdAt = FieldValue.serverTimestamp();
  const updatedAt = FieldValue.serverTimestamp();

  it("should update data ver.0 to ver.2.", async () => {
    // Prepare
    deleted.get.mockImplementationOnce(() => undefined);

    // Call
    let result = await updateDataV2(db, deleted);

    // Verify
    expect(result).toEqual({ data: 2 });
    expect(db.collection.mock.calls).toEqual([["service"]]);
    expect(doc.mock.calls).toEqual([["auth"]]);
    expect(set.mock.calls).toEqual([[{ createdAt }]]);
    expect(deleted.ref.set.mock.calls).toEqual([
      [
        {
          ver: 2,
          err: null,
          updatedAt,
        },
      ],
    ]);
  });

  it("should update data ver.1 to ver.2.", async () => {
    // Prepare
    deleted.get.mockImplementationOnce(() => 1);

    // Call
    let result = await updateDataV2(db, deleted);

    // Verify
    expect(result).toEqual({ data: 2 });
    expect(db.collection.mock.calls).toEqual([["service"]]);
    expect(doc.mock.calls).toEqual([["auth"]]);
    expect(set.mock.calls).toEqual([[{ createdAt }]]);
    expect(deleted.ref.set.mock.calls).toEqual([
      [
        {
          ver: 2,
          err: null,
          updatedAt,
        },
      ],
    ]);
  });

  it("should return error if doc().set() raises exception.", async () => {
    // Prepare
    deleted.get.mockImplementationOnce(() => 1);
    const err = new Error("test error");
    set.mockRejectedValueOnce(err);

    // Call
    let result = await updateDataV2(db, deleted);

    // Verify
    expect(result).toEqual({ err, data: 1 });
    expect(db.collection.mock.calls).toEqual([["service"]]);
    expect(doc.mock.calls).toEqual([["auth"]]);
    expect(set.mock.calls).toEqual([[{ createdAt }]]);
    expect(deleted.ref.set).not.toHaveBeenCalled();
  });

  it("should not update data of ver.2.", async () => {
    // Prepare
    deleted.get.mockImplementationOnce(() => 2);

    // Call
    let result = await updateDataV2(db, deleted);

    // Verify
    expect(result).toEqual({ data: 2 });
    expect(db.collection).not.toHaveBeenCalled();
    expect(doc).not.toHaveBeenCalled();
    expect(set).not.toHaveBeenCalled();
    expect(deleted.ref.set).not.toHaveBeenCalled();
  });
});

describe("updateDataV3", () => {
  const get = vi.fn();
  const add = vi.fn();
  const update = vi.fn();
  const doc = vi.fn(() => ({ get, update }));
  const db = { collection: vi.fn(() => ({ doc, add })) };
  const deleted = {
    id: "dataVersion",
    exists: true,
    get: vi.fn(),
    ref: { set: vi.fn() },
  };
  const createdAt = FieldValue.serverTimestamp();
  const updatedAt = FieldValue.serverTimestamp();

  it("should update data ver.0 to ver.3.", async () => {
    // Prepare
    deleted.get.mockImplementationOnce(() => undefined);

    // Call
    let result = await updateDataV3(db, deleted);

    // Verify
    expect(result).toEqual({ data: 3 });
    expect(db.collection.mock.calls).toEqual([["service"]]);
    expect(doc.mock.calls).toEqual([["conf"]]);
    expect(update.mock.calls).toEqual([[{ tz: "Asia/Tokyo", updatedAt }]]);
    expect(deleted.ref.set.mock.calls).toEqual([
      [
        {
          ver: 3,
          err: null,
          updatedAt,
        },
      ],
    ]);
  });

  it("should update data ver.2 to ver.3.", async () => {
    // Prepare
    deleted.get.mockImplementationOnce(() => 2);

    // Call
    let result = await updateDataV3(db, deleted);

    // Verify
    expect(result).toEqual({ data: 3 });
    expect(db.collection.mock.calls).toEqual([["service"]]);
    expect(doc.mock.calls).toEqual([["conf"]]);
    expect(update.mock.calls).toEqual([[{ tz: "Asia/Tokyo", updatedAt }]]);
    expect(deleted.ref.set.mock.calls).toEqual([
      [
        {
          ver: 3,
          err: null,
          updatedAt,
        },
      ],
    ]);
  });

  it("should return error if doc().set() raises exception.", async () => {
    // Prepare
    deleted.get.mockImplementationOnce(() => 2);
    const err = new Error("test error");
    update.mockRejectedValueOnce(err);

    // Call
    let result = await updateDataV3(db, deleted);

    // Verify
    expect(result).toEqual({ err, data: 2 });
    expect(db.collection.mock.calls).toEqual([["service"]]);
    expect(doc.mock.calls).toEqual([["conf"]]);
    expect(update.mock.calls).toEqual([[{ tz: "Asia/Tokyo", updatedAt }]]);
    expect(deleted.ref.set).not.toHaveBeenCalled();
  });

  it("should not update data of ver.3.", async () => {
    // Prepare
    deleted.get.mockImplementationOnce(() => 3);

    // Call
    let result = await updateDataV3(db, deleted);

    // Verify
    expect(result).toEqual({ data: 3 });
    expect(db.collection).not.toHaveBeenCalled();
    expect(doc).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
    expect(deleted.ref.set).not.toHaveBeenCalled();
  });
});
