import { describe, expect, it } from "vitest";
import {
  generateNickname,
  generateUniqueNickname,
  validateNickname,
  getAvailableNouns,
  getAvailableAdjectives,
  NICKNAME_RULES,
} from "./nickname-generator";

describe("generateNickname", () => {
  it("generates random nicknames without seed", () => {
    const nickname1 = generateNickname();
    const nickname2 = generateNickname();

    expect(nickname1).toMatch(NICKNAME_RULES.pattern);
    expect(nickname2).toMatch(NICKNAME_RULES.pattern);
    expect(nickname1).not.toBe(nickname2);
  });

  it("generates deterministic nicknames with seed", () => {
    const seed = "test-seed";
    const nickname1 = generateNickname(seed);
    const nickname2 = generateNickname(seed);

    expect(nickname1).toBe(nickname2);
    expect(nickname1).toMatch(NICKNAME_RULES.pattern);
    expect(nickname1.length).toBeGreaterThanOrEqual(NICKNAME_RULES.minLength);
    expect(nickname1.length).toBeLessThanOrEqual(NICKNAME_RULES.maxLength);
  });

  it("produces PascalCase nicknames", () => {
    for (let i = 0; i < 10; i++) {
      const nickname = generateNickname();
      expect(nickname.charAt(0)).toMatch(/[A-Z]/);
    }
  });

  it("uses Vietnam animals from expanded list", () => {
    const animals = getAvailableNouns();
    const vietnamAnimals = [
      "buffalo",
      "elephant",
      "tiger",
      "leopard",
      "pangolin",
      "saola",
      "gibbon",
      "hornbill",
      "gecko",
      "dolphin",
      "cobra",
      "butterfly",
      "tapir",
      "slowloris",
    ];

    for (const animal of vietnamAnimals) {
      expect(animals).toContain(animal);
    }

    expect(animals.length).toBeGreaterThan(50);
  });

  it("includes animals from all categories", () => {
    const animals = getAvailableNouns();

    const mammals = ["buffalo", "elephant", "tiger", "leopard", "pangolin"];
    const birds = ["crane", "hornbill", "kingfisher", "eagle", "pheasant"];
    const reptiles = ["cobra", "python", "gecko", "turtle", "crocodile"];
    const marine = ["dolphin", "dugong", "catfish", "shark", "eel"];

    for (const category of [mammals, birds, reptiles, marine]) {
      const hasAnimalFromCategory = category.some((animal) =>
        animals.includes(animal),
      );
      expect(hasAnimalFromCategory).toBe(true);
    }
  });
});

describe("generateUniqueNickname", () => {
  it("generates unique nickname when no conflicts", () => {
    const nickname = generateUniqueNickname("test-seed");
    expect(nickname).toMatch(NICKNAME_RULES.pattern);
  });

  it("adds suffix when nickname exists", () => {
    const existingNames = new Set(["SwiftBuffalo"]);
    const checkFn = (name: string) => existingNames.has(name);

    const nickname = generateUniqueNickname("test", checkFn);
    expect(nickname).toMatch(NICKNAME_RULES.pattern);
    expect(nickname).not.toBe("SwiftBuffalo");
  });

  it("falls back to timestamp after max attempts", () => {
    const alwaysExists = () => true;
    const nickname = generateUniqueNickname("test", alwaysExists);

    expect(nickname).toMatch(NICKNAME_RULES.pattern);
    expect(nickname.length).toBeGreaterThan(10);
  });
});

describe("validateNickname", () => {
  it("validates correct nicknames", () => {
    const result = validateNickname("SwiftTiger");
    expect(result.valid).toBe(true);
    expect(result.normalized).toBe("swifttiger");
  });

  it("rejects nicknames that are too short", () => {
    const result = validateNickname("Hi");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("TOO_SHORT");
  });

  it("rejects nicknames that are too long", () => {
    const result = validateNickname(
      "ThisIsAVeryLongNicknameThatExceedsTheLimit",
    );
    expect(result.valid).toBe(false);
    expect(result.error).toBe("TOO_LONG");
  });

  it("rejects nicknames with invalid format", () => {
    const result = validateNickname("swift-tiger");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("INVALID_FORMAT");
  });

  it("rejects reserved nicknames", () => {
    const result = validateNickname("Admin");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("RESERVED");
  });
});

describe("Vietnam animals quality checks", () => {
  it("contains no inappropriate animal names", () => {
    const animals = getAvailableNouns();
    const inappropriate = ["pig", "rat", "worm", "snake", "bat"];

    for (const name of inappropriate) {
      expect(animals).not.toContain(name);
    }
  });

  it("uses appropriate naming conventions", () => {
    const animals = getAvailableNouns();

    for (const animal of animals) {
      expect(animal).toMatch(/^[a-z]+$/);
      expect(animal.length).toBeGreaterThan(2);
      expect(animal.length).toBeLessThan(20);
    }
  });

  it("generates diverse nickname combinations", () => {
    const adjectives = getAvailableAdjectives();
    const animals = getAvailableNouns();
    const combinations = adjectives.length * animals.length;

    expect(combinations).toBeGreaterThan(3000);
  });
});
