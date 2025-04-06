import { describe, it, expect } from "vitest";

import { validateEmail, validatePassword } from "../../../src/lib/validator.js";

describe("validateEmail", () => {
  it("should return false if given value is undefined.", () => {
    expect(validateEmail(undefined)).toBeFalsy();
  });

  it("should return false if given value is not a string.", () => {
    expect(validateEmail(1)).toBeFalsy();
    expect(validateEmail(null)).toBeFalsy();
    expect(validateEmail({})).toBeFalsy();
    expect(validateEmail([])).toBeFalsy();
  });

  it("should return false if given value is empty.", () => {
    expect(validateEmail("")).toBeFalsy();
  });

  it("should return false if given value is not a valid email.", () => {
    expect(validateEmail("test")).toBeFalsy();
    expect(validateEmail("test@")).toBeFalsy();
    expect(validateEmail("test@example")).toBeFalsy();
    expect(validateEmail("test@example.")).toBeFalsy();
    expect(validateEmail("@")).toBeFalsy();
    expect(validateEmail("@example")).toBeFalsy();
    expect(validateEmail("@example.")).toBeFalsy();
    expect(validateEmail("t est@example.com")).toBeFalsy();
    expect(validateEmail("test @example.com")).toBeFalsy();
    expect(validateEmail("test@ example.com")).toBeFalsy();
    expect(validateEmail("test@example .com")).toBeFalsy();
  });

  it("should return true if given value is a valid email.", () => {
    expect(validateEmail("test@example.com")).toBeTruthy();
  });
});

describe("validatePassword", () => {
  it("should return false if given value is undefined.", () => {
    expect(validatePassword(undefined)).toBeFalsy();
  });

  it("should return false if given value is not a string.", () => {
    expect(validatePassword(1)).toBeFalsy();
    expect(validatePassword(null)).toBeFalsy();
    expect(validatePassword({})).toBeFalsy();
    expect(validatePassword([])).toBeFalsy();
  });

  it("should return false if given value is empty.", () => {
    expect(validatePassword("")).toBeFalsy();
  });

  it("should return false if given value is less than 8 characters.", () => {
    expect(validatePassword("Aa1234#")).toBeFalsy();
  });

  it("should return false if given value does not contain a lowercase letter.", () => {
    expect(validatePassword("AA12345#")).toBeFalsy();
  });

  it("should return false if given value does not contain a uppercase letter.", () => {
    expect(validatePassword("aa12345#")).toBeFalsy();
  });

  it("should return false if given value does not contain a numeric letter.", () => {
    expect(validatePassword("a@abcde#")).toBeFalsy();
  });

  it("should return false if given value does not contain a symbol letter.", () => {
    expect(validatePassword("a0abcde9")).toBeFalsy();
  });

  it("should return true if given value is a valid password.", () => {
    expect(validatePassword("Aa12345#")).toBeTruthy();
  });
});
