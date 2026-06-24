import { describe, expect, it } from "vitest";
import { shiftDate } from "@/lib/date";

describe("date utilities", () => {
  it("shifts across month and year boundaries", () => {
    expect(shiftDate("2026-12-31", 1)).toBe("2027-01-01");
    expect(shiftDate("2026-03-01", -1)).toBe("2026-02-28");
  });
});
