import { describe, it, expect } from "vitest";

import { config, reCaptchaKey, region } from "../../src/firebaseConfig";

describe("firebaseConfig", () => {
  it("should hide 'apiKey'.", () => {
    expect(config.apiKey).toEqual("FIREBASE_API_KEY");
  });

  it("should hide 'reCaptchaKey'.", () => {
    expect(reCaptchaKey).toEqual("FIREBASE_RECAPTCHA_KEY");
  });

  it("should set valid 'region'.", () => {
    expect(region).toEqual("asia-northeast2");
  });
});
