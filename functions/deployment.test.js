const { createAuthUser } = require("./account.js");

const { updateDataV1 } = require("./deployment.js");

jest.mock("firebase-functions/logger");
jest.mock("./account.js");

afterEach(() => {
  jest.clearAllMocks();
});

describe("updateDataV1", () => {
  const uid = "123456";
  const email = "test@example.com";
  const auth = { getUser: jest.fn(), updateUser: jest.fn() };
  const get = jest.fn();
  const add = jest.fn();
  const set = jest.fn();
  const doc = jest.fn(() => ({ get, set }));
  const db = { collection: jest.fn(() => ({ doc, add })) };
  const conf = {
    exists: true,
    id: "conf",
    get: jest.fn(),
  };
  const deleted = {
    id: "dataVersion",
    exists: true,
    get: jest.fn(),
    ref: { set: jest.fn() },
  };
  const invitationSubject = "Invitation from Black bream";
  const invitationBody = "Please change your initial password: PASSWORD";
  const webAppUrl = process.env.WEB_APP_URL;
  const autoSendEmail = process.env.AUTO_SEND_EMAIL;
  const createdAt = expect.any(Date);
  const updatedAt = expect.any(Date);

  it("should update data ver.0 to ver.1", async () => {
    // Prepare
    deleted.get
      .mockImplementationOnce(() => 0)
      .mockImplementationOnce(() => email);
    add.mockImplementationOnce(() => ({ id: uid }));
    createAuthUser.mockImplementationOnce(() => undefined);

    // Call
    let [err, ver] = await updateDataV1(auth, db, deleted, null);

    // Evaluate
    expect(err).toBeUndefined();
    expect(ver).toEqual(1);
    expect(db.collection.mock.calls).toEqual([
      ["service"],
      ["users"],
      ["groups"],
      ["groups"],
    ]);
    expect(doc.mock.calls).toEqual([[conf.id], ["admins"], ["managers"]]);
    expect(set.mock.calls).toEqual([
      [
        {
          desc: expect.stringMatching(/## Privacy Policy/),
          invitationSubject,
          invitationBody,
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
    expect(createAuthUser.mock.calls).toEqual([[auth, db, uid, email]]);
    expect(deleted.ref.set.mock.calls).toEqual([
      [
        {
          ver: 1,
          err: undefined,
          updatedAt,
        },
      ],
    ]);
  });

  it("should return error if email is missing", async () => {
    // Prepare
    deleted.get
      .mockImplementationOnce(() => 0)
      .mockImplementationOnce(() => undefined);

    // Call
    let [err, ver] = await updateDataV1(auth, db, deleted, null);

    // Evaluate
    expect(err).toBe("missing-email");
    expect(ver).toEqual(0);
    expect(db.collection.mock.calls).toEqual([]);
    expect(doc.mock.calls).toEqual([]);
    expect(set.mock.calls).toEqual([]);
    expect(add.mock.calls).toEqual([]);
    expect(createAuthUser.mock.calls).toEqual([]);
    expect(deleted.ref.set.mock.calls).toEqual([]);
  });

  it("should return error if set returns error", async () => {
    // Prepare
    deleted.get
      .mockImplementationOnce(() => 0)
      .mockImplementationOnce(() => email);
    set.mockImplementationOnce(() => Promise.reject("error"));

    // Call
    let [err, ver] = await updateDataV1(auth, db, deleted, null);

    // Evaluate
    expect(err).toEqual("error");
    expect(ver).toEqual(0);
    expect(db.collection.mock.calls).toEqual([["service"]]);
    expect(doc.mock.calls).toEqual([[conf.id]]);
    expect(set.mock.calls).toEqual([
      [
        {
          desc: expect.stringMatching(/## Privacy Policy/),
          invitationSubject,
          invitationBody,
          webAppUrl,
          autoSendEmail,
          createdAt,
          updatedAt,
        },
      ],
    ]);
    expect(add.mock.calls).toEqual([]);
    expect(createAuthUser.mock.calls).toEqual([]);
    expect(deleted.ref.set.mock.calls).toEqual([]);
  });

  it("should return error if createAuthUser returns error", async () => {
    // Prepare
    deleted.get
      .mockImplementationOnce(() => 0)
      .mockImplementationOnce(() => email);
    add.mockImplementationOnce(() => ({ id: uid }));
    createAuthUser.mockImplementationOnce(() => "error");

    // Call
    let [err, ver] = await updateDataV1(auth, db, deleted, null);

    // Evaluate
    expect(err).toEqual("error");
    expect(ver).toEqual(0);
    expect(db.collection.mock.calls).toEqual([["service"], ["users"]]);
    expect(doc.mock.calls).toEqual([[conf.id]]);
    expect(set.mock.calls).toEqual([
      [
        {
          desc: expect.stringMatching(/## Privacy Policy/),
          invitationSubject,
          invitationBody,
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
    expect(createAuthUser.mock.calls).toEqual([[auth, db, uid, email]]);
    expect(deleted.ref.set.mock.calls).toEqual([]);
  });

  it("should not update data of ver.1", async () => {
    // Prepare
    deleted.get.mockImplementationOnce(() => 1);

    // Call
    let [err, ver] = await updateDataV1(auth, db, deleted, null);

    // Evaluate
    expect(err).toBeUndefined();
    expect(ver).toEqual(1);
    expect(db.collection.mock.calls).toEqual([]);
    expect(doc.mock.calls).toEqual([]);
    expect(set.mock.calls).toEqual([]);
    expect(add.mock.calls).toEqual([]);
    expect(createAuthUser.mock.calls).toEqual([]);
    expect(deleted.ref.set.mock.calls).toEqual([]);
  });

  it("should call next", async () => {
    // Prepare
    deleted.get.mockImplementationOnce(() => 1);
    const next = jest.fn(() => Promise.resolve([undefined, 2]));

    // Call
    let [err, ver] = await updateDataV1(auth, db, deleted, next);

    // Evaluate
    expect(err).toBeUndefined();
    expect(ver).toEqual(2);
    expect(db.collection.mock.calls).toEqual([]);
    expect(doc.mock.calls).toEqual([]);
    expect(set.mock.calls).toEqual([]);
    expect(add.mock.calls).toEqual([]);
    expect(createAuthUser.mock.calls).toEqual([]);
    expect(deleted.ref.set.mock.calls).toEqual([]);
    expect(next.mock.calls).toEqual([[]]);
  });
});
