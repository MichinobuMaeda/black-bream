import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";

import { localstorage } from "../../../src/lib/localstorage.js";
import {
  t,
  dow,
  store,
  isMemberOf,
  saveLocale,
  isUniqueUserName,
  isUniqueGroupName,
  groupsOfUser,
} from "../../../src/lib/store.svelte.js";

vi.mock("localstorage");
localstorage.locale.load = vi.fn();
localstorage.locale.save = vi.fn();

afterEach(() => {
  vi.clearAllMocks();
});

describe("t", () => {
  it("should return the correct translation.", () => {
    // Prepare #1
    store.locale = "ja";

    // Execute and Verify #1
    expect(t().send()).toEqual("送信");

    // Prepare #2
    store.locale = "en";

    // Execute and Verify #2
    expect(t().send()).toEqual("Send");
  });
});

describe("dow", () => {
  it("should return the correct day of the week.", () => {
    // Prepare
    store.locale = "ja";

    // Execute and Verify
    expect(dow().short(6)).toEqual("土");
  });
});

describe("store", () => {
  it("should have the correct initial state.", () => {
    // Prepare

    // Execute

    // Verify
    expect(store).toEqual({
      locale: "ja",
      authUser: undefined,
      conf: undefined,
      auth: undefined,
      users: [],
      groups: [],
      posts: [],
      templates: [],
      logs: [],
      me: undefined,
      admin: false,
      manager: false,
      operator: false,
    });
  });

  it("should return the correct locale.", () => {
    // Execute and Verify
    store.locale = "en";
    expect(store.locale).toEqual("en");
  });

  it("should return the correct authUser.", () => {
    // Execute and Verify
    store.authUser = { type: "auth.User" };
    expect(store.authUser).toEqual({ type: "auth.User" });
  });

  it("should return the correct conf.", () => {
    // Execute and Verify
    store.conf = { id: "conf" };
    expect(store.conf).toEqual({ id: "conf" });
  });

  it("should return the correct auth.", () => {
    // Execute and Verify
    store.auth = { id: "auth" };
    expect(store.auth).toEqual({ id: "auth" });
  });

  it("should return the correct users.", () => {
    // Execute and Verify
    store.users = [{ id: "user1" }, { id: "user2" }];
    expect(store.users).toEqual([{ id: "user1" }, { id: "user2" }]);
  });

  it("should return the correct groups.", () => {
    // Execute and Verify
    store.groups = [{ id: "group1" }, { id: "group2" }];
    expect(store.groups).toEqual([{ id: "group1" }, { id: "group2" }]);
  });

  it("should return the correct posts.", () => {
    // Execute and Verify
    store.posts = [{ id: "post1" }, { id: "post2" }];
    expect(store.posts).toEqual([{ id: "post1" }, { id: "post2" }]);
  });

  it("should return the correct templates.", () => {
    // Execute and Verify
    store.templates = [{ id: "template1" }, { id: "template2" }];
    expect(store.templates).toEqual([{ id: "template1" }, { id: "template2" }]);
  });
});

describe("store.me", () => {
  afterEach(() => {
    store.authUser = undefined;
    store.users = [];
    store.groups = [];
  });

  it("should be the correct user.", () => {
    // Prepare
    const user1 = { id: "user1" };
    const user2 = { id: "user2" };
    store.users = [user1, user2];

    const group1 = { id: "group1", users: ["user1"] };
    const group2 = { id: "group2", users: ["user1", "user2"] };
    store.groups = [group1, group2];

    store.authUser = { uid: user1.id };

    // Execute and Verify
    expect(store.me).toEqual(user1);
  });

  it("should be undefined if the user is not found.", () => {
    // Prepare
    const user1 = { id: "user1" };
    const user2 = { id: "user2" };
    store.users = [user2];

    const group1 = { id: "group1", users: ["user1"] };
    const group2 = { id: "group2", users: ["user1", "user2"] };
    store.groups = [group1, group2];

    store.authUser = { uid: user1.id };

    // Execute and Verify
    expect(store.me).toEqual(undefined);
  });

  it("should be undefined if the authUser is undefined.", () => {
    // Prepare
    const user1 = { id: "user1" };
    const user2 = { id: "user2" };
    store.users = [user1, user2];

    const group1 = { id: "group1", users: ["user1"] };
    const group2 = { id: "group2", users: ["user1", "user2"] };
    store.groups = [group1, group2];

    store.authUser = undefined;

    // Execute and Verify
    expect(store.me).toEqual(undefined);
  });
});

describe("isMemberOf", () => {
  afterEach(() => {
    store.authUser = undefined;
    store.users = [];
    store.groups = [];
  });

  it("should return true if the user is a member of the group.", () => {
    // Prepare
    const user1 = { id: "user1" };
    const user2 = { id: "user2" };
    store.users = [user1, user2];

    const group1 = { id: "group1", users: ["user1"] };
    const group2 = { id: "group2", users: ["user1", "user2"] };
    store.groups = [group1, group2];

    // Execute and Verify
    expect(isMemberOf(user1.id, group1.id)).toEqual(true);
    expect(isMemberOf(user2.id, group1.id)).toEqual(false);
    expect(isMemberOf(user1.id, "group3")).toEqual(false);
  });
});

describe("store.admin", () => {
  afterEach(() => {
    store.authUser = undefined;
    store.users = [];
    store.groups = [];
  });

  it("should be the authenticated user is admin or not.", () => {
    // Prepare
    const user1 = { id: "user1" };
    const user2 = { id: "user2" };
    store.users = [user1, user2];

    const group1 = { id: "group1", users: [user1.id] };
    const group2 = { id: "group2", users: [user1.id, user2.id] };
    const admins = { id: "admins", users: [user1.id] };
    store.groups = [group1, group2, admins];

    // Prepare #1
    store.authUser = { uid: user1.id };

    // Execute and Verify #1
    expect(store.admin).toEqual(true);

    // Prepare #2
    store.authUser = { uid: user2.id };

    // Execute and Verify #2
    expect(store.admin).toEqual(false);
  });
});

describe("store.manager", () => {
  afterEach(() => {
    store.authUser = undefined;
    store.users = [];
    store.groups = [];
  });

  it("should be the authenticated user is manager or not.", () => {
    // Prepare
    const user1 = { id: "user1" };
    const user2 = { id: "user2" };
    store.users = [user1, user2];

    const group1 = { id: "group1", users: [user1.id] };
    const group2 = { id: "group2", users: [user1.id, user2.id] };
    const managers = { id: "managers", users: [user1.id] };
    store.groups = [group1, group2, managers];

    // Prepare #1
    store.authUser = { uid: user1.id };

    // Execute and Verify #1
    expect(store.manager).toEqual(true);

    // Prepare #2
    store.authUser = { uid: user2.id };

    // Execute and Verify #2
    expect(store.manager).toEqual(false);
  });
});

describe("store.operator", () => {
  afterEach(() => {
    store.authUser = undefined;
    store.users = [];
    store.groups = [];
  });

  it("should be the authenticated user is operator or not.", () => {
    // Prepare
    const user1 = { id: "user1" };
    const user2 = { id: "user2" };
    store.users = [user1, user2];

    const group1 = { id: "group1", users: [user1.id] };
    const group2 = { id: "group2", users: [user1.id, user2.id] };
    const operators = { id: "operators", users: [user1.id] };
    store.groups = [group1, group2, operators];

    // Prepare #1
    store.authUser = { uid: user1.id };

    // Execute and Verify #1
    expect(store.operator).toEqual(true);

    // Prepare #2
    store.authUser = { uid: user2.id };

    // Execute and Verify #2
    expect(store.operator).toEqual(false);
  });
});

describe("saveLocale", () => {
  it("should save the locale if locale has been changed.", () => {
    // Prepare
    store.locale = "en";
    localstorage.locale.load.mockImplementationOnce(() => "ja");

    // Execute
    saveLocale();

    // Verify
    expect(localstorage.locale.load.mock.calls).toEqual([[]]);
    expect(localstorage.locale.save.mock.calls).toEqual([["en"]]);
  });

  it("should not save the locale if locale has not been changed.", () => {
    // Prepare
    store.locale = "ja";
    localstorage.locale.load.mockImplementationOnce(() => "ja");

    // Execute
    saveLocale();

    // Verify
    expect(localstorage.locale.load.mock.calls).toEqual([[]]);
    expect(localstorage.locale.save.mock.calls).toEqual([]);
  });
});

describe("isUniqueUserName", () => {
  it("should return true if the user name is unique.", () => {
    // Prepare
    store.users = [
      { id: "user1", name: "user1" },
      { id: "user2", name: "user2" },
    ];

    // Execute and Verify #1
    expect(isUniqueUserName("user3")).toEqual(true);

    // Execute and Verify #2
    expect(isUniqueUserName(undefined)).toEqual(true);
  });

  it("should return false if the user name is not unique.", () => {
    // Prepare
    store.users = [
      { id: "user1", name: "user1" },
      { id: "user2", name: "user2" },
    ];

    // Execute and Verify
    expect(isUniqueUserName("user1 ")).toEqual(false);
  });
});

describe("isUniqueGroupName", () => {
  it("should return true if the group name is unique.", () => {
    // Prepare
    store.groups = [
      { id: "group1", name: "group1" },
      { id: "group2", name: "group2" },
    ];

    // Execute and Verify #1
    expect(isUniqueGroupName("group3")).toEqual(true);

    // Execute and Verify #2
    expect(isUniqueGroupName(undefined)).toEqual(true);
  });

  it("should return false if the group name is not unique.", () => {
    // Prepare
    store.groups = [
      { id: "group1", name: "group1" },
      { id: "group2", name: "group2" },
    ];

    // Execute and Verify
    expect(isUniqueGroupName("group1 ")).toEqual(false);
  });
});

describe("groupsOfUser", () => {
  it(
    "should return the groups of the user except deleted" +
      " if user is not manager.",
    () => {
      // Prepare
      const user1 = { id: "user1" };
      const user2 = { id: "user2" };
      store.users = [user1, user2];

      const group1 = { id: "group1", users: [user1.id, user2.id] };
      const group2 = { id: "group2", users: [user2.id] };
      const group3 = { id: "group3", users: [user1.id], deletedAt: new Date() };
      const managers = { id: "managers", users: [user2.id] };
      store.groups = [group1, group2, group3, managers];

      store.authUser = { uid: user1.id };

      // Execute and Verify
      expect(groupsOfUser(user1.id)).toEqual([group1]);
      expect(groupsOfUser(user2.id)).toEqual([group1, group2, managers]);
    },
  );

  it(
    "should return the groups of the user including deleted" +
      " if user is manager.",
    () => {
      // Prepare
      const user1 = { id: "user1" };
      const user2 = { id: "user2" };
      store.users = [user1, user2];

      const group1 = { id: "group1", users: [user1.id, user2.id] };
      const group2 = { id: "group2", users: [user2.id] };
      const group3 = { id: "group3", users: [user1.id], deletedAt: new Date() };
      const managers = { id: "managers", users: [user1.id] };
      store.groups = [group1, group2, group3, managers];

      store.authUser = { uid: user1.id };

      // Execute and Verify
      expect(groupsOfUser(user1.id)).toEqual([group1, group3, managers]);
      expect(groupsOfUser(user2.id)).toEqual([group1, group2]);
    },
  );

  it("should return empty array if users is not found.", () => {
    // Prepare
    const user1 = { id: "user1" };
    const user2 = { id: "user2" };
    store.users = [user1, user2];

    const group1 = { id: "group1", users: undefined };
    store.groups = [group1];

    // Execute and Verify
    expect(groupsOfUser("user1")).toEqual([]);
  });
});
