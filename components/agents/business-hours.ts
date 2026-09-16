import {
  BUSINESS_HOURS_SLOTS_MAX,
  WEEK_DAYS,
  type BusinessHoursSlot,
  type WeekDay,
} from "@/lib/api/ai-agents";

export const WEEK_DAY_LABELS: Record<WeekDay, string> = {
  Monday: "Lunes",
  Tuesday: "Martes",
  Wednesday: "Miércoles",
  Thursday: "Jueves",
  Friday: "Viernes",
  Saturday: "Sábado",
  Sunday: "Domingo",
};

/** What most businesses answer when asked for their hours, so nobody starts from an empty week. */
export function defaultBusinessWeek(): BusinessHoursSlot[] {
  return WEEK_DAYS.filter((day) => day !== "Saturday" && day !== "Sunday").map((day) => ({
    day,
    opens: "09:00:00",
    closes: "18:00:00",
  }));
}

/** `<input type="time">` speaks "HH:mm"; the API speaks "HH:mm:ss". */
export function toTimeInput(apiTime: string): string {
  return apiTime.slice(0, 5);
}

export function toApiTime(inputTime: string): string {
  return inputTime.length === 5 ? `${inputTime}:00` : inputTime;
}

/** Keeps the week in the order people read it, and every stretch of a day together. */
export function groupByDay(slots: ReadonlyArray<BusinessHoursSlot>): Array<{
  day: WeekDay;
  slots: BusinessHoursSlot[];
}> {
  return WEEK_DAYS.map((day) => ({
    day,
    slots: slots.filter((slot) => slot.day === day),
  }));
}

/**
 * Mirrors what the API refuses, so the owner learns before the request leaves. Returns the
 * reason in Spanish, or null when the week is fine.
 */
export function validateBusinessHours(slots: ReadonlyArray<BusinessHoursSlot>): string | null {
  if (slots.length === 0) {
    return "Marca al menos un día con horario. Si no quieres que tu asistente responda, pausa el asistente.";
  }
  if (slots.length > BUSINESS_HOURS_SLOTS_MAX) {
    return `Puedes definir hasta ${BUSINESS_HOURS_SLOTS_MAX} franjas en la semana.`;
  }
  for (const slot of slots) {
    if (slot.closes <= slot.opens) {
      return `En ${WEEK_DAY_LABELS[slot.day].toLowerCase()}, la hora de cierre tiene que ser posterior a la de apertura. Si cierras pasada la medianoche, usa una franja para cada día.`;
    }
  }
  return null;
}
