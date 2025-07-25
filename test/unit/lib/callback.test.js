import { afterEach, describe, it, expect, vi } from "vitest";

import { CallbackHandler } from "../../../src/lib/callback.js";

afterEach(() => {
  vi.clearAllMocks();
});

describe("invalidItemError", () => {
  it("should return error message for invalid item.", () => {
    // Prepare
    const callbackHandler = new CallbackHandler({});
    const item = "invalidItem";

    // Execute
    const result = callbackHandler.invalidItemError(item);

    // Verify
    expect(result).toBe(`CallbackHandler receive invalid item: ${item}`);
  });
});

describe("invalidActionError", () => {
  it("should return error message for invalid action.", () => {
    // Prepare
    const callbackHandler = new CallbackHandler({});
    const item = "invalidItem";
    const action = "invalidAction";

    // Execute
    const result = callbackHandler.invalidActionError(item, action);

    // Verify
    expect(result).toBe(
      `CallbackHandler receive invalid action: ${item}/${action}`,
    );
  });
});

describe("generateRedirectPath", () => {
  it("should generate redirect path.", () => {
    // Prepare
    const callbackHandler = new CallbackHandler({});
    const item = "item";
    const action = "action";
    const status = "status";
    const data = "data";

    // Execute
    const result = callbackHandler.generateRedirectPath(
      item,
      action,
      status,
      data,
    );

    // Verify
    expect(result).toBe(`/#/auth/${item}/${action}/${status}/${data}`);
  });
});

describe("onThreadsCallback", () => {
  it("should generate redirect path for Threads callback with code.", () => {
    // Prepare
    const params = new URLSearchParams();
    params.set("code", "testCode#_");
    const callbackHandler = new CallbackHandler({ search: params.toString() });
    const item = "item";
    const action = "action";

    // Execute
    const result = callbackHandler.onThreadsCallback(item, action);

    // Verify
    expect(result).toBe(`/#/auth/${item}/${action}/ok/testCode`);
  });

  it("should generate redirect path for Threads callback without code.", () => {
    // Prepare
    const params = new URLSearchParams();
    params.set("error", "testError");
    const callbackHandler = new CallbackHandler({ search: params.toString() });
    const item = "item";
    const action = "action";

    // Execute
    const result = callbackHandler.onThreadsCallback(item, action);

    // Verify
    expect(result).toBe(`/#/auth/${item}/${action}/ng/testError`);
  });
});

describe("onTumblrCallback", () => {
  it("should generate redirect path for Tumblr callback with code.", () => {
    // Prepare
    const params = new URLSearchParams();
    params.set("state", "ok");
    params.set("code", "testCode");
    const callbackHandler = new CallbackHandler({ search: params.toString() });
    const item = "item";
    const action = "action";

    // Execute
    const result = callbackHandler.onTumblrCallback(item, action);

    // Verify
    expect(result).toBe(`/#/auth/${item}/${action}/ok/testCode`);
  });

  it("should generate redirect path for Tumblr callback without code.", () => {
    // Prepare
    const params = new URLSearchParams();
    const callbackHandler = new CallbackHandler({ search: params.toString() });
    const item = "item";
    const action = "action";

    // Execute
    const result = callbackHandler.onTumblrCallback(item, action);

    // Verify
    expect(result).toBe(`/#/auth/${item}/${action}/ng/error`);
  });
});

describe("onTwitterCallback", () => {
  it("should generate redirect path for Twitter callback with state.", () => {
    // Prepare
    const params = new URLSearchParams();
    params.set("state", "ok");
    params.set("code", "testCode");
    const callbackHandler = new CallbackHandler({ search: params.toString() });
    const item = "item";
    const action = "action";

    // Execute
    const result = callbackHandler.onTwitterCallback(item, action);

    // Verify
    expect(result).toBe(`/#/auth/${item}/${action}/ok/testCode`);
  });

  it("should generate redirect path for Twitter callback without state.", () => {
    // Prepare
    const params = new URLSearchParams();
    const callbackHandler = new CallbackHandler({ search: params.toString() });
    const item = "item";
    const action = "action";

    // Execute
    const result = callbackHandler.onTwitterCallback(item, action);

    // Verify
    expect(result).toBe(`/#/auth/${item}/${action}/ng/error`);
  });
});

describe("getRedirectPath", () => {
  it(
    "should return redirect path for Threads callback " +
      "if given pathname is '/auth/threads/callback'.",
    () => {
      // Prepare
      const params = new URLSearchParams();
      params.set("code", "testCode#_");
      const callbackHandler = new CallbackHandler({
        pathname: "/auth/threads/callback",
        search: params.toString(),
      });

      // Execute
      const { err, data } = callbackHandler.getRedirectPath();

      // Verify
      expect(err).toBeUndefined();
      expect(data).toBe(`/#/auth/threads/callback/ok/testCode`);
    },
  );

  it(
    "should return error" +
      " if given pathname is '/auth/threads/[unsupported]'.",
    () => {
      // Prepare
      const params = new URLSearchParams();
      params.set("code", "testCode#_");
      const callbackHandler = new CallbackHandler({
        pathname: "/auth/threads/invalidAction",
        search: params.toString(),
      });

      // Execute
      const { err, data } = callbackHandler.getRedirectPath();

      // Verify
      expect(err).toBe(
        "CallbackHandler receive invalid action: threads/invalidAction",
      );
      expect(data).toBeUndefined();
    },
  );

  it(
    "should return redirect path for Tumblr callback " +
      "if given pathname is '/auth/tumblr/callback'.",
    () => {
      // Prepare
      const params = new URLSearchParams();
      params.set("state", "ok");
      params.set("code", "testCode");
      const callbackHandler = new CallbackHandler({
        pathname: "/auth/tumblr/callback",
        search: params.toString(),
      });

      // Execute
      const { err, data } = callbackHandler.getRedirectPath();

      // Verify
      expect(err).toBeUndefined();
      expect(data).toBe(`/#/auth/tumblr/callback/ok/testCode`);
    },
  );

  it(
    "should return error" +
      " if given pathname is '/auth/tumblr/[unsupported]'.",
    () => {
      // Prepare
      const params = new URLSearchParams();
      params.set("code", "testCode");
      const callbackHandler = new CallbackHandler({
        pathname: "/auth/tumblr/invalidAction",
        search: params.toString(),
      });

      // Execute
      const { err, data } = callbackHandler.getRedirectPath();

      // Verify
      expect(err).toBe(
        "CallbackHandler receive invalid action: tumblr/invalidAction",
      );
      expect(data).toBeUndefined();
    },
  );

  it(
    "should return redirect path for Twitter callback" +
      " if given pathname is '/auth/twitter/callback'.",
    () => {
      // Prepare
      const params = new URLSearchParams();
      params.set("state", "ok");
      params.set("code", "testCode");
      const callbackHandler = new CallbackHandler({
        pathname: "/auth/twitter/callback",
        search: params.toString(),
      });

      // Execute
      const { err, data } = callbackHandler.getRedirectPath();

      // Verify
      expect(err).toBeUndefined();
      expect(data).toBe(`/#/auth/twitter/callback/ok/testCode`);
    },
  );

  it(
    "should return error" +
      " if given pathname is '/auth/twitter/[unsupported]'.",
    () => {
      // Prepare
      const params = new URLSearchParams();
      params.set("code", "testCode");
      const callbackHandler = new CallbackHandler({
        pathname: "/auth/twitter/invalidAction",
        search: params.toString(),
      });

      // Execute
      const { err, data } = callbackHandler.getRedirectPath();

      // Verify
      expect(err).toBe(
        "CallbackHandler receive invalid action: twitter/invalidAction",
      );
      expect(data).toBeUndefined();
    },
  );

  it(
    "should return error" + " if given pathname is '/auth/[unsupported]'.",
    () => {
      // Prepare
      const params = new URLSearchParams();
      params.set("code", "testCode");
      const callbackHandler = new CallbackHandler({
        pathname: "/auth/invalidItem/callback",
        search: params.toString(),
      });

      // Execute
      const { err, data } = callbackHandler.getRedirectPath();

      // Verify
      expect(err).toBe("CallbackHandler receive invalid item: invalidItem");
      expect(data).toBeUndefined();
    },
  );

  it("should return no dat for unsupported pathname.", () => {
    // Prepare
    const params = new URLSearchParams();
    params.set("code", "testCode");
    const callbackHandler = new CallbackHandler({
      pathname: "/unsupported/pathname",
      search: params.toString(),
    });

    // Execute
    const { err, data } = callbackHandler.getRedirectPath();

    // Verify
    expect(err).toBeUndefined();
    expect(data).toBeUndefined();
  });
});

describe("handle", () => {
  it("should not redirect if getRedirectPath() returns error.", () => {
    // Prepare
    CallbackHandler.prototype.getRedirectPath = vi.fn(() => ({
      err: "error",
      data: undefined,
    }));
    const mockReplace = vi.fn();
    const callbackHandler = new CallbackHandler({
      pathname: "/auth/invalidItem/callback",
      search: "code=testCode",
      replace: mockReplace,
    });

    // Execute
    callbackHandler.handle();

    // Verify
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("should call replace if getRedirectPath() returns data.", () => {
    // Prepare
    CallbackHandler.prototype.getRedirectPath = vi.fn(() => ({
      err: undefined,
      data: "http://example.com/pathname",
    }));
    const mockReplace = vi.fn();
    const callbackHandler = new CallbackHandler({
      pathname: "/auth/invalidItem/callback",
      search: "code=testCode",
      replace: mockReplace,
    });

    // Execute
    callbackHandler.handle();

    // Verify
    expect(mockReplace.mock.calls).toEqual([["http://example.com/pathname"]]);
  });

  it("should not redirect if getRedirectPath() returns no data.", () => {
    // Prepare
    CallbackHandler.prototype.getRedirectPath = vi.fn(() => ({
      err: undefined,
      data: undefined,
    }));
    const mockReplace = vi.fn();
    const callbackHandler = new CallbackHandler({
      pathname: "/auth/invalidItem/callback",
      search: "code=testCode",
      replace: mockReplace,
    });

    // Execute
    callbackHandler.handle();

    // Verify
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
