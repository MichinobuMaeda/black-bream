const { describe, it, expect, afterEach } = require("@jest/globals");
const { logger } = require("firebase-functions/v2");

const { updateData } = require("./deployment.js");

afterEach(() => {
  const { jest } = require("@jest/globals");
  jest.clearAllMocks();
});

describe("updateData", () => {
  const { jest } = require("@jest/globals");

  jest.mock("axios");
  jest.mock("firebase-functions/v2");
  logger.info = jest.fn();
  logger.error = jest.fn();

  const email = "user@example.com";
  const savedOnV1Error = {
    ver: 0,
    err: expect.any(String),
    updatedAt: expect.any(Date),
  };
  const savedOnSuccess = {
    ver: 1,
    err: null,
    updatedAt: expect.any(Date),
  };
  const deleted = {
    exists: true,
    id: "service/dataVersion",
    get: jest.fn((key) => (key == "email" ? email : undefined)),
    ref: {
      set: jest.fn(),
    },
  };
  const auth = {
    getUserByEmail: jest.fn(() => {
      throw { code: "auth/user-not-found" };
    }),
    updateUser: jest.fn(),
    createUser: jest.fn(() => ({ uid: "234567" })),
  };
  const add = jest.fn();
  const set = jest.fn();
  const doc = jest.fn(() => ({ set }));
  const db = {
    collection: jest.fn(() => ({
      doc,
      add,
    })),
  };
  const emailParam = {
    to: email,
    message: {
      subject: "Invitation from Black bream",
      text: expect.stringMatching(`Please change your initial password.
Your temporary password is `),
    },
  };

  it("returns [null, 1] if the current data version is 0 with email address.", async () => {
    // Prepare
    auth.getUserByEmail.mockImplementationOnce(() => ({ uid: "123456" }));

    // Call
    const ret = await updateData(auth, db, deleted);

    // Evaluate
    expect(ret).toEqual([null, 1]);
    expect(deleted.get.mock.calls).toEqual([["ver"], ["email"]]);
    expect(deleted.ref.set.mock.calls).toEqual([[savedOnSuccess]]);

    expect(logger.info.mock.calls).toEqual([
      ["Current dataVersion: 0"],
      ["Created 'service/conf'"],
      ["Sent an email to user@example.com"],
    ]);
    expect(logger.error.mock.calls).toEqual([]);

    expect(auth.getUserByEmail.mock.calls).toEqual([[email]]);
    expect(auth.updateUser.mock.calls).toEqual([
      ["123456", { email, password: expect.any(String) }],
    ]);
    expect(auth.createUser.mock.calls).toEqual([]);

    expect(db.collection.mock.calls).toEqual([
      ["service"],
      ["users"],
      ["mail"],
      ["groups"],
      ["groups"],
    ]);
    expect(add.mock.calls).toEqual([[emailParam]]);
    expect(doc.mock.calls).toEqual([
      ["conf"],
      ["123456"],
      ["admins"],
      ["managers"],
    ]);
    expect(set.mock.calls).toEqual([
      [
        {
          desc: expect.any(String),
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
      ],
      [
        {
          name: "Primary User",
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
      ],
      [
        {
          users: ["123456"],
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
      ],
      [
        {
          users: ["123456"],
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
      ],
    ]);
  });

  it("returns [error, 0] with exception on deleted.get(key).", async () => {
    // Prepare
    deleted.get.mockImplementationOnce(() => {
      throw new Error();
    });

    // Call
    const ret = await updateData(auth, db, deleted);

    // Evaluate
    expect(ret).toEqual([expect.any(String), 0]);
    expect(deleted.get.mock.calls).toEqual([["ver"]]);
    expect(deleted.ref.set.mock.calls).toEqual([[savedOnV1Error]]);

    expect(logger.info.mock.calls).toEqual([]);
    expect(logger.error.mock.calls).toEqual([[expect.any(Error)]]);

    expect(auth.getUserByEmail.mock.calls).toEqual([]);
    expect(auth.updateUser.mock.calls).toEqual([]);
    expect(auth.createUser.mock.calls).toEqual([]);

    expect(db.collection.mock.calls).toEqual([]);
    expect(add.mock.calls).toEqual([]);
    expect(doc.mock.calls).toEqual([]);
    expect(set.mock.calls).toEqual([]);
  });

  it("returns [error, 0] with unknown exception on getUserByEmail().", async () => {
    // Prepare
    auth.getUserByEmail.mockImplementationOnce(() => {
      throw new Error("Unknown error");
    });

    // Call
    const ret = await updateData(auth, db, deleted);

    // Evaluate
    expect(ret).toEqual([expect.any(String), 0]);
    expect(deleted.get.mock.calls).toEqual([["ver"], ["email"]]);
    expect(deleted.ref.set.mock.calls).toEqual([[savedOnV1Error]]);

    expect(logger.info.mock.calls).toEqual([
      ["Current dataVersion: 0"],
      ["Created 'service/conf'"],
    ]);
    expect(logger.error.mock.calls).toEqual([[expect.any(Error)]]);

    expect(auth.getUserByEmail.mock.calls).toEqual([[email]]);
    expect(auth.updateUser.mock.calls).toEqual([]);
    expect(auth.createUser.mock.calls).toEqual([]);

    expect(db.collection.mock.calls).toEqual([["service"]]);
    expect(add.mock.calls).toEqual([]);
    expect(doc.mock.calls).toEqual([["conf"]]);
    expect(set.mock.calls).toEqual([
      [
        {
          desc: expect.any(String),
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
      ],
    ]);
  });

  it("returns [error, 0] with unknown exception on updateUser().", async () => {
    // Prepare
    auth.getUserByEmail.mockImplementationOnce(() => ({ uid: "123456" }));
    auth.updateUser.mockImplementationOnce(() => {
      throw new Error("Unknown error");
    });

    // Call
    const ret = await updateData(auth, db, deleted);

    // Evaluate
    expect(ret).toEqual([expect.any(String), 0]);
    expect(deleted.get.mock.calls).toEqual([["ver"], ["email"]]);
    expect(deleted.ref.set.mock.calls).toEqual([[savedOnV1Error]]);

    expect(logger.info.mock.calls).toEqual([
      ["Current dataVersion: 0"],
      ["Created 'service/conf'"],
    ]);
    expect(logger.error.mock.calls).toEqual([[expect.any(Error)]]);

    expect(auth.getUserByEmail.mock.calls).toEqual([[email]]);
    expect(auth.updateUser.mock.calls).toEqual([
      ["123456", { email, password: expect.any(String) }],
    ]);
    expect(auth.createUser.mock.calls).toEqual([]);

    expect(db.collection.mock.calls).toEqual([["service"]]);
    expect(add.mock.calls).toEqual([]);
    expect(doc.mock.calls).toEqual([["conf"]]);
    expect(set.mock.calls).toEqual([
      [
        {
          desc: expect.any(String),
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
      ],
    ]);
  });

  it("returns [error, 0] with unknown exception on createUser().", async () => {
    // Prepare
    auth.createUser.mockImplementationOnce(() => {
      throw new Error("Unknown error");
    });

    // Call
    const ret = await updateData(auth, db, deleted);

    // Evaluate
    expect(ret).toEqual([expect.any(String), 0]);
    expect(deleted.get.mock.calls).toEqual([["ver"], ["email"]]);
    expect(deleted.ref.set.mock.calls).toEqual([[savedOnV1Error]]);

    expect(logger.info.mock.calls).toEqual([
      ["Current dataVersion: 0"],
      ["Created 'service/conf'"],
    ]);
    expect(logger.error.mock.calls).toEqual([[expect.any(Error)]]);

    expect(auth.getUserByEmail.mock.calls).toEqual([[email]]);
    expect(auth.updateUser.mock.calls).toEqual([]);
    expect(auth.createUser.mock.calls).toEqual([
      [{ email, password: expect.any(String) }],
    ]);

    expect(db.collection.mock.calls).toEqual([["service"]]);
    expect(add.mock.calls).toEqual([]);
    expect(doc.mock.calls).toEqual([["conf"]]);
    expect(set.mock.calls).toEqual([
      [
        {
          desc: expect.any(String),
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
      ],
    ]);
  });

  it("returns [error, 0] with exception on collection(key).doc(key).set({}).", async () => {
    // Prepare
    set.mockImplementationOnce(() => {
      throw new Error();
    });

    // Call
    const ret = await updateData(auth, db, deleted);

    // Evaluate
    expect(ret).toEqual([expect.any(String), 0]);
    expect(deleted.get.mock.calls).toEqual([["ver"]]);
    expect(deleted.ref.set.mock.calls).toEqual([[savedOnV1Error]]);

    expect(logger.info.mock.calls).toEqual([["Current dataVersion: 0"]]);
    expect(logger.error.mock.calls).toEqual([[expect.any(Error)]]);

    expect(auth.getUserByEmail.mock.calls).toEqual([]);
    expect(auth.updateUser.mock.calls).toEqual([]);
    expect(auth.createUser.mock.calls).toEqual([]);

    expect(db.collection.mock.calls).toEqual([["service"]]);
    expect(add.mock.calls).toEqual([]);
    expect(doc.mock.calls).toEqual([["conf"]]);
    expect(set.mock.calls).toEqual([
      [
        {
          desc: expect.any(String),
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
      ],
    ]);
  });

  it("returns [error, 0] with exception on collection(key).add({}).", async () => {
    // Prepare
    add.mockImplementationOnce(() => {
      throw new Error();
    });

    // Call
    const ret = await updateData(auth, db, deleted);

    // Evaluate
    expect(ret).toEqual([expect.any(String), 0]);
    expect(deleted.get.mock.calls).toEqual([["ver"], ["email"]]);
    expect(deleted.ref.set.mock.calls).toEqual([[savedOnV1Error]]);

    expect(logger.info.mock.calls).toEqual([
      ["Current dataVersion: 0"],
      ["Created 'service/conf'"],
    ]);
    expect(logger.error.mock.calls).toEqual([[expect.any(Error)]]);

    expect(auth.getUserByEmail.mock.calls).toEqual([[email]]);
    expect(auth.updateUser.mock.calls).toEqual([]);
    expect(auth.createUser.mock.calls).toEqual([
      [{ email, password: expect.any(String) }],
    ]);

    expect(db.collection.mock.calls).toEqual([
      ["service"],
      ["users"],
      ["mail"],
    ]);
    expect(add.mock.calls).toEqual([[emailParam]]);
    expect(doc.mock.calls).toEqual([["conf"], ["234567"]]);
    expect(set.mock.calls).toEqual([
      [
        {
          desc: expect.any(String),
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
      ],
      [
        {
          name: "Primary User",
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
      ],
    ]);
  });

  it("returns [error, 0] with exception on deleted.ref.set({}).", async () => {
    // Prepare
    deleted.ref.set.mockImplementationOnce(() => {
      throw new Error();
    });

    // Call
    const ret = await updateData(auth, db, deleted);

    // Evaluate
    expect(ret).toEqual([expect.any(String), 1]);
    expect(deleted.get.mock.calls).toEqual([["ver"], ["email"]]);
    expect(deleted.ref.set.mock.calls).toEqual([[savedOnSuccess]]);

    expect(logger.info.mock.calls).toEqual([
      ["Current dataVersion: 0"],
      ["Created 'service/conf'"],
      ["Sent an email to user@example.com"],
    ]);
    expect(logger.error.mock.calls).toEqual([[expect.any(Error)]]);

    expect(auth.getUserByEmail.mock.calls).toEqual([[email]]);
    expect(auth.updateUser.mock.calls).toEqual([]);
    expect(auth.createUser.mock.calls).toEqual([
      [{ email, password: expect.any(String) }],
    ]);

    expect(db.collection.mock.calls).toEqual([
      ["service"],
      ["users"],
      ["mail"],
      ["groups"],
      ["groups"],
    ]);
    expect(add.mock.calls).toEqual([[emailParam]]);
    expect(doc.mock.calls).toEqual([
      ["conf"],
      ["234567"],
      ["admins"],
      ["managers"],
    ]);
    expect(set.mock.calls).toEqual([
      [
        {
          desc: expect.any(String),
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
      ],
      [
        {
          name: "Primary User",
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
      ],
      [
        {
          users: ["234567"],
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
      ],
      [
        {
          users: ["234567"],
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
      ],
    ]);
  });

  it("returns [error, 0] if the current data version is 0 without email address.", async () => {
    // Prepare
    deleted.get
      .mockImplementationOnce(() => undefined)
      .mockImplementationOnce(() => undefined);
    const error = "undefined: email";

    // Call
    const ret = await updateData(auth, db, deleted);

    // Evaluate
    expect(ret).toEqual([error, 0]);
    expect(deleted.get.mock.calls).toEqual([["ver"], ["email"]]);
    expect(deleted.ref.set.mock.calls).toEqual([
      [
        {
          ver: 0,
          err: error,
          updatedAt: expect.any(Date),
        },
      ],
    ]);

    expect(logger.info.mock.calls).toEqual([
      ["Current dataVersion: 0"],
      ["Created 'service/conf'"],
    ]);
    expect(logger.error.mock.calls).toEqual([[error]]);

    expect(auth.getUserByEmail.mock.calls).toEqual([]);
    expect(auth.updateUser.mock.calls).toEqual([]);
    expect(auth.createUser.mock.calls).toEqual([]);

    expect(db.collection.mock.calls).toEqual([["service"]]);
    expect(add.mock.calls).toEqual([]);
    expect(doc.mock.calls).toEqual([["conf"]]);
    expect(set.mock.calls).toEqual([
      [
        {
          desc: expect.any(String),
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
      ],
    ]);
  });

  it("returns [null, 1] if the current data version is 1.", async () => {
    // Prepare
    deleted.get.mockImplementationOnce(() => 1);

    // Call
    const ret = await updateData(auth, db, deleted);

    // Evaluate
    expect(ret).toEqual([null, 1]);
    expect(deleted.ref.set.mock.calls).toEqual([[savedOnSuccess]]);

    expect(logger.info.mock.calls).toEqual([["Current dataVersion: 1"]]);
    expect(logger.error.mock.calls).toEqual([]);

    expect(auth.getUserByEmail.mock.calls).toEqual([]);
    expect(auth.updateUser.mock.calls).toEqual([]);
    expect(auth.createUser.mock.calls).toEqual([]);

    expect(db.collection.mock.calls).toEqual([]);
    expect(add.mock.calls).toEqual([]);
    expect(doc.mock.calls).toEqual([]);
    expect(set.mock.calls).toEqual([]);
  });
});
