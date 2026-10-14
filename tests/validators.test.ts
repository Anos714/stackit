import { describe, expect, test } from "bun:test";
import { __test__ } from "../src/validators/environment.ts";

const { isAtLeast, parseVersion } = __test__;

describe("parseVersion", () => {
  test("parses plain versions", () => {
    expect(parseVersion("v22.19.0")).toEqual({ major: 22, minor: 19, patch: 0 });
    expect(parseVersion("bun 1.4.0")).toEqual({ major: 1, minor: 4, patch: 0 });
  });

  test("parses go-style output", () => {
    expect(parseVersion("go version go1.24.3 linux/amd64")).toEqual({
      major: 1,
      minor: 24,
      patch: 3,
    });
  });

  test("throws on garbage", () => {
    expect(() => parseVersion("no version here honestly")).toThrow();
  });
});

describe("isAtLeast", () => {
  test("higher major wins regardless of minor/patch", () => {
    // The old buggy check (major>= && minor>= && patch>=) failed this.
    expect(isAtLeast({ major: 22, minor: 0, patch: 0 }, { major: 20, minor: 5, patch: 1 })).toBe(true);
  });

  test("same major compares minor then patch", () => {
    expect(isAtLeast({ major: 20, minor: 4, patch: 9 }, { major: 20, minor: 5, patch: 1 })).toBe(false);
    expect(isAtLeast({ major: 20, minor: 5, patch: 1 }, { major: 20, minor: 5, patch: 1 })).toBe(true);
    expect(isAtLeast({ major: 20, minor: 5, patch: 2 }, { major: 20, minor: 5, patch: 1 })).toBe(true);
  });

  test("lower major fails", () => {
    expect(isAtLeast({ major: 18, minor: 99, patch: 99 }, { major: 20, minor: 0, patch: 0 })).toBe(false);
  });
});
