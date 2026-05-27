import { validateIdCard, validatePhone } from "../lib/validate.js";

describe("validateIdCard", () => {
  it("accepts a valid ID card with correct checksum", () => {
    // 110101199001011237: computed checksum digit is 7
    expect(validateIdCard("110101199001011237")).toBeNull();
  });

  it("accepts ID card ending with X", () => {
    // 32010219900101234X: computed checksum digit is X
    expect(validateIdCard("32010219900101234X")).toBeNull();
  });

  it("rejects too short ID", () => {
    expect(validateIdCard("12345")).toBeTruthy();
  });

  it("rejects non-digit characters in first 17 positions", () => {
    expect(validateIdCard("1101011A9001011237")).toBeTruthy();
  });

  it("rejects wrong checksum", () => {
    // Valid: ...1237, invalid: ...1238
    expect(validateIdCard("110101199001011238")).toBeTruthy();
  });

  it("rejects empty string", () => {
    expect(validateIdCard("")).toBeTruthy();
  });
});

describe("validatePhone", () => {
  it("accepts valid phone numbers", () => {
    expect(validatePhone("13800138000")).toBeNull();
    expect(validatePhone("15912345678")).toBeNull();
    expect(validatePhone("19900001111")).toBeNull();
  });

  it("returns null for empty/undefined phone (optional field)", () => {
    expect(validatePhone("")).toBeNull();
  });

  it("rejects phone not starting with 1", () => {
    expect(validatePhone("23800138000")).toBeTruthy();
  });

  it("rejects phone starting with 12", () => {
    expect(validatePhone("12000138000")).toBeTruthy();
  });

  it("rejects too short phone", () => {
    expect(validatePhone("1380013")).toBeTruthy();
  });
});
