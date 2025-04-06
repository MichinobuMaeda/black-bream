import { afterEach, describe, it, expect, vi } from "vitest";

import { localstorage } from "../../../src/lib/localstorage.js";

global.localStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};

afterEach(() => {
  vi.clearAllMocks();
});

describe("localstorage", () => {
  const locale = "en";
  const defaultLocale = "ja";
  const email = "user@example.com";
  const twitterState = "twitter_state";
  const twitterChallenge = "twitter_challenge";
  const tumblrState = "tumblr_state";
  const watchdogTimeout = 60;

  it("should load locale.", () => {
    // Prepare
    localStorage.getItem.mockReturnValueOnce(locale);

    // Execute and Verify
    expect(localstorage.locale.load()).toBe(locale);
  });

  it("should load default locale.", () => {
    // Prepare
    localStorage.getItem.mockReturnValueOnce(null);

    // Execute and Verify
    expect(localstorage.locale.load()).toBe(defaultLocale);
  });

  it("should save locale.", () => {
    // Execute
    localstorage.locale.save(locale);

    // Verify
    expect(localStorage.setItem.mock.calls).toEqual([
      ["black_bream_locale", locale],
    ]);
  });

  it("should save default locale if the given value is empty.", () => {
    // Execute
    localstorage.locale.save(undefined);
    localstorage.locale.save(null);
    localstorage.locale.save("");

    // Verify
    expect(localStorage.setItem.mock.calls).toEqual([
      ["black_bream_locale", defaultLocale],
      ["black_bream_locale", defaultLocale],
      ["black_bream_locale", defaultLocale],
    ]);
  });

  it("should load email.", () => {
    // Prepare
    localStorage.getItem.mockReturnValueOnce(email);

    // Execute and Verify
    expect(localstorage.email.load()).toBe(email);
  });

  it("should load empty email.", () => {
    // Prepare
    localStorage.getItem.mockReturnValueOnce(null);

    // Execute and Verify
    expect(localstorage.email.load()).toBe("");
  });

  it("should save email.", () => {
    // Execute
    localstorage.email.save(email);

    // Verify
    expect(localStorage.setItem.mock.calls).toEqual([
      ["black_bream_email", email],
    ]);
  });

  it("should save empty email.", () => {
    // Execute
    localstorage.email.save(undefined);
    localstorage.email.save(null);
    localstorage.email.save("");

    // Verify
    expect(localStorage.setItem.mock.calls).toEqual([
      ["black_bream_email", ""],
      ["black_bream_email", ""],
      ["black_bream_email", ""],
    ]);
  });

  it("should remove email.", () => {
    // Execute
    localstorage.email.clear();

    // Verify
    expect(localStorage.removeItem.mock.calls).toEqual([["black_bream_email"]]);
  });

  it("should load twitter state.", () => {
    // Prepare
    localStorage.getItem.mockReturnValueOnce(twitterState);

    // Execute and Verify
    expect(localstorage.twitter.state.load()).toBe(twitterState);
  });

  it("should load empty twitter state.", () => {
    // Prepare
    localStorage.getItem.mockReturnValueOnce(null);

    // Execute and Verify
    expect(localstorage.twitter.state.load()).toBe("");
  });

  it("should save twitter state.", () => {
    // Execute
    localstorage.twitter.state.save(twitterState);

    // Verify
    expect(localStorage.setItem.mock.calls).toEqual([
      ["black_bream_twitter_state", twitterState],
    ]);
  });

  it("should save empty twitter state.", () => {
    // Execute
    localstorage.twitter.state.save(undefined);
    localstorage.twitter.state.save(null);
    localstorage.twitter.state.save("");

    // Verify
    expect(localStorage.setItem.mock.calls).toEqual([
      ["black_bream_twitter_state", ""],
      ["black_bream_twitter_state", ""],
      ["black_bream_twitter_state", ""],
    ]);
  });

  it("should load twitter challenge.", () => {
    // Prepare
    localStorage.getItem.mockReturnValueOnce(twitterChallenge);

    // Execute and Verify
    expect(localstorage.twitter.challenge.load()).toBe(twitterChallenge);
  });

  it("should load empty twitter challenge.", () => {
    // Prepare
    localStorage.getItem.mockReturnValueOnce(null);

    // Execute and Verify
    expect(localstorage.twitter.challenge.load()).toBe("");
  });

  it("should save twitter challenge.", () => {
    // Execute
    localstorage.twitter.challenge.save(twitterChallenge);

    // Verify
    expect(localStorage.setItem.mock.calls).toEqual([
      ["black_bream_twitter_challenge", twitterChallenge],
    ]);
  });

  it("should save empty twitter challenge.", () => {
    // Execute
    localstorage.twitter.challenge.save(undefined);
    localstorage.twitter.challenge.save(null);
    localstorage.twitter.challenge.save("");

    // Verify
    expect(localStorage.setItem.mock.calls).toEqual([
      ["black_bream_twitter_challenge", ""],
      ["black_bream_twitter_challenge", ""],
      ["black_bream_twitter_challenge", ""],
    ]);
  });

  it("should load tumblr state.", () => {
    // Prepare
    localStorage.getItem.mockReturnValueOnce(tumblrState);

    // Execute and Verify
    expect(localstorage.tumblr.state.load()).toBe(tumblrState);
  });

  it("should load empty tumblr state.", () => {
    // Prepare
    localStorage.getItem.mockReturnValueOnce(null);

    // Execute and Verify
    expect(localstorage.tumblr.state.load()).toBe("");
  });

  it("should save tumblr state.", () => {
    // Execute
    localstorage.tumblr.state.save(tumblrState);

    // Verify
    expect(localStorage.setItem.mock.calls).toEqual([
      ["black_bream_tumblr_state", tumblrState],
    ]);
  });

  it("should save empty tumblr state.", () => {
    // Execute
    localstorage.tumblr.state.save(undefined);
    localstorage.tumblr.state.save(null);
    localstorage.tumblr.state.save("");

    // Verify
    expect(localStorage.setItem.mock.calls).toEqual([
      ["black_bream_tumblr_state", ""],
      ["black_bream_tumblr_state", ""],
      ["black_bream_tumblr_state", ""],
    ]);
  });

  it("should load watchdog timeout.", () => {
    // Prepare
    localStorage.getItem.mockReturnValueOnce(watchdogTimeout);

    // Execute and Verify
    expect(localstorage.watchdogTimeout.load()).toBe(watchdogTimeout);
  });

  it("should load zero watchdog timeout.", () => {
    // Prepare
    localStorage.getItem.mockReturnValueOnce(null);

    // Execute and Verify
    expect(localstorage.watchdogTimeout.load()).toBe(0);
  });

  it("should save watchdog timeout.", () => {
    // Execute
    localstorage.watchdogTimeout.save(watchdogTimeout);

    // Verify
    expect(localStorage.setItem.mock.calls).toEqual([
      ["black_bream_watchdog_timeout", watchdogTimeout.toString()],
    ]);
  });

  it("should save zero watchdog timeout if given value is empty.", () => {
    // Execute
    localstorage.watchdogTimeout.save(undefined);
    localstorage.watchdogTimeout.save(null);
    localstorage.watchdogTimeout.save("");

    // Verify
    expect(localStorage.setItem.mock.calls).toEqual([
      ["black_bream_watchdog_timeout", "0"],
      ["black_bream_watchdog_timeout", "0"],
      ["black_bream_watchdog_timeout", "0"],
    ]);
  });
});
