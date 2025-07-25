import fs from "fs";
import path from "path";
import { afterEach, describe, it, expect, vi } from "vitest";

import {
  getFileExtension,
  getMimeTypeFromExtension,
  reduceImageSize,
} from "../../../src/lib/media.js";

afterEach(() => {
  vi.clearAllMocks();
});

describe("getFileExtension", () => {
  it("should return the correct file extension", () => {
    expect(getFileExtension("file.txt")).toBe("txt");
    expect(getFileExtension("file")).toBe("");
    expect(getFileExtension("file.tar.gz")).toBe("gz");
    expect(getFileExtension("file..tar.gz")).toBe("gz");
    expect(getFileExtension("http://exaple.com/file.txt")).toBe("txt");
  });

  it("should return an empty string for an empty filename", () => {
    expect(getFileExtension("")).toBe("");
  });
});

describe("getMimeTypeFromExtension", () => {
  it("should return the correct mime type for known extensions", () => {
    expect(getMimeTypeFromExtension("txt")).toBe("text/plain");
    expect(getMimeTypeFromExtension("jpg")).toBe("image/jpeg");
    expect(getMimeTypeFromExtension("png")).toBe("image/png");
  });

  it("should return application/octet-stream for unknown extensions", () => {
    expect(getMimeTypeFromExtension("unknown")).toBe(
      "application/octet-stream",
    );
  });

  it("should return the default mime type if provided", () => {
    expect(getMimeTypeFromExtension("unknown", "custom/type")).toBe(
      "custom/type",
    );
  });
});

describe("reduceImageSize", () => {
  window.URL.createObjectURL = vi.fn();
  global.Image.prototype.decode = vi.fn(() => Promise.resolve());

  it("should not reduce size of the image less than parameter maxSize.", async () => {
    // Prepare
    const maxSize = 1000000;
    const mimeType = "image/jpeg";
    const file = new Blob([new Uint8Array(maxSize)], { type: mimeType });

    // Execute
    const result = await reduceImageSize(document, file, mimeType, maxSize);

    // Verify
    expect(result).toEqual(file);
  });

  it("should reduce size of the image larger than parameter maxSize.", async () => {
    // Prepare
    const maxSize = 1000 * 1000;
    const mimeType = "image/jpeg";
    const filename = "sample2232689.jpg";
    const filePath = path.join("test", "unit", "lib", filename);
    window.URL.createObjectURL.mockReturnValueOnce(filePath);
    let buffer = fs.readFileSync(filePath);
    const file = new File([buffer], filename, { type: mimeType });

    // Execute
    const ret = await reduceImageSize(document, file, mimeType, maxSize, 0.8);

    // Verify
    expect(ret.size).toBeLessThan(file.size);
  });

  it("should return same image if the image is not a valid image", async () => {
    // Prepare
    const maxSize = 1000 * 1000;
    const mimeType = "image/jpeg";
    const filename = "sample2232689.jpg";
    const filePath = path.join("test", "unit", "lib", filename);
    console.log("filePath", filePath);
    window.URL.createObjectURL.mockReturnValueOnce(filePath);
    let buffer = fs.readFileSync(filePath);
    const file = new File([buffer], filename, { type: mimeType });
    global.Image.prototype.decode.mockImplementationOnce(() =>
      Promise.reject("Invalid image"),
    );

    // Execute
    const ret = await reduceImageSize(document, file, mimeType, maxSize, 0.8);

    // Verify
    expect(ret).toEqual(file);
  });
});
