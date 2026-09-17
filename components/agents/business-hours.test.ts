import type { BusinessHoursSlot } from "@/lib/api/ai-agents";
import { describe, expect, it } from "vitest";
import {
  defaultBusinessWeek,
  groupByDay,
  toApiTime,
  toTimeInput,
  validateBusinessHours,
  WEEK_DAY_LABELS,
} from "./business-hours";

const monday: BusinessHoursSlot = { day: "Monday", opens: "09:00:00", closes: "13:00:00" };

describe("time conversion", () => {
  it("drops the seconds the time input cannot show", () => {
    expect(toTimeInput("08:00:00")).toBe("08:00");
  });

  it("adds the seconds the API returns", () => {
    expect(toApiTime("08:00")).toBe("08:00:00");
  });

  it("leaves a value that already has seconds alone", () => {
    expect(toApiTime("08:00:00")).toBe("08:00:00");
  });
});

describe("groupByDay", () => {
  it("lists the whole week in reading order, even the closed days", () => {
    const grouped = groupByDay([monday]);

    expect(grouped.map((entry) => entry.day)).toEqual([
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ]);
    expect(grouped[0].slots).toEqual([monday]);
    expect(grouped[1].slots).toEqual([]);
  });

  it("keeps every stretch of the same day together, so a split shift survives", () => {
    const afternoon: BusinessHoursSlot = { day: "Monday", opens: "15:00:00", closes: "19:00:00" };

    expect(groupByDay([monday, afternoon])[0].slots).toEqual([monday, afternoon]);
  });
});

describe("validateBusinessHours", () => {
  it("accepts a normal week", () => {
    expect(validateBusinessHours(defaultBusinessWeek())).toBeNull();
  });

  it("starts the week on the days most businesses actually open", () => {
    expect(defaultBusinessWeek().map((slot) => slot.day)).toEqual([
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
    ]);
  });

  it("refuses an empty week and points at the switch instead", () => {
    expect(validateBusinessHours([])).toBe(
      "Marca al menos un día con horario. Si no quieres que tu asistente responda, pausa el asistente.",
    );
  });

  it("refuses more stretches than the API allows", () => {
    const tooMany = Array.from({ length: 22 }, () => monday);

    expect(validateBusinessHours(tooMany)).toBe("Puedes definir hasta 21 franjas en la semana.");
  });

  it("refuses a stretch that would cross midnight and says how to split it", () => {
    const overnight: BusinessHoursSlot = { day: "Friday", opens: "22:00:00", closes: "02:00:00" };

    expect(validateBusinessHours([overnight])).toMatch(/viernes/);
    expect(validateBusinessHours([overnight])).toMatch(/una franja para cada día/);
  });

  it("refuses a stretch that closes exactly when it opens", () => {
    expect(validateBusinessHours([{ day: "Monday", opens: "09:00:00", closes: "09:00:00" }])).not.toBeNull();
  });
});

describe("WEEK_DAY_LABELS", () => {
  it("names every day in Spanish", () => {
    expect(Object.values(WEEK_DAY_LABELS)).toEqual([
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
      "Domingo",
    ]);
  });
});
