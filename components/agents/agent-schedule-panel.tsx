"use client";

import { Button } from "@/components/ui/button";
import { RadioCardGroup } from "@/components/ui/radio-card-group";
import { useToast } from "@/components/ui/toast";
import {
  saveBusinessHours,
  type AiAgent,
  type BusinessHours,
  type BusinessHoursSlot,
  type WeekDay,
} from "@/lib/api/ai-agents";
import { toUserMessage } from "@/lib/api/errors";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  defaultBusinessWeek,
  groupByDay,
  toApiTime,
  toTimeInput,
  validateBusinessHours,
  WEEK_DAY_LABELS,
} from "./business-hours";

type Duty = "always" | "outsideBusinessHours";

const DUTY_OPTIONS = [
  {
    value: "always" as const,
    title: "Siempre",
    description: "Atiende a cualquier hora, todos los días.",
  },
  {
    value: "outsideBusinessHours" as const,
    title: "Solo fuera del horario laboral",
    description: "Tu equipo atiende en horario; el asistente cubre el resto.",
  },
];

export type AgentSchedulePanelProps = {
  tenantId: string;
  agentId: string;
  businessHours: BusinessHours | null;
  onSaved: (agent: AiAgent) => void;
};

export function AgentSchedulePanel({
  tenantId,
  agentId,
  businessHours,
  onSaved,
}: AgentSchedulePanelProps) {
  const { notify } = useToast();
  const [duty, setDuty] = useState<Duty>(businessHours ? "outsideBusinessHours" : "always");
  const [slots, setSlots] = useState<BusinessHoursSlot[]>(
    businessHours?.slots ?? defaultBusinessWeek(),
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const editing = duty === "outsideBusinessHours";

  const replaceSlot = (target: BusinessHoursSlot, changes: Partial<BusinessHoursSlot>) => {
    setSlots((current) => current.map((slot) => (slot === target ? { ...slot, ...changes } : slot)));
    setError(null);
  };

  const addSlot = (day: WeekDay) => {
    setSlots((current) => [...current, { day, opens: "09:00:00", closes: "18:00:00" }]);
    setError(null);
  };

  const removeSlot = (target: BusinessHoursSlot) => {
    setSlots((current) => current.filter((slot) => slot !== target));
    setError(null);
  };

  const save = async () => {
    let body: BusinessHours | null = null;
    if (editing) {
      const problem = validateBusinessHours(slots);
      if (problem) {
        setError(problem);
        return;
      }
      // The team covers its own hours, so the assistant takes everything outside them.
      body = { slots, outsideHours: "AssistantAnswers" };
    }
    setError(null);
    setSaving(true);
    try {
      const saved = await saveBusinessHours(tenantId, agentId, body);
      onSaved(saved);
      notify(
        body
          ? "Listo. Tu asistente atiende fuera de tu horario."
          : "Listo. Tu asistente atiende a cualquier hora.",
        "success",
      );
    } catch (caught) {
      notify(toUserMessage(caught), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <p className="rounded-lg border border-info-border bg-info-bg px-3 py-2 text-xs text-info-fg">
        Esto empieza a regir apenas lo guardes, sin esperar a que publiques.
      </p>

      <RadioCardGroup
        name="duty"
        legend="¿Cuándo trabaja?"
        options={DUTY_OPTIONS}
        value={duty}
        onChange={(next) => {
          setDuty(next);
          setError(null);
        }}
        disabled={saving}
      />

      {editing ? (
        <fieldset className="flex flex-col gap-3" disabled={saving}>
          <legend className="mb-1 text-sm font-medium text-foreground">Tu horario laboral</legend>
          <p className="-mt-1 text-xs text-muted">
            Las horas en que atiende tu equipo. Fuera de ellas responde el asistente. Un día sin
            franjas queda cubierto por el asistente todo el día.
          </p>

          <ul className="flex flex-col gap-2">
            {groupByDay(slots).map(({ day, slots: daySlots }) => (
              <li
                key={day}
                className="flex flex-col gap-2 rounded-lg border border-border bg-surface px-3 py-2.5 sm:flex-row sm:items-start sm:gap-4"
              >
                <span className="pt-1.5 text-sm font-medium text-foreground sm:w-28 sm:shrink-0">
                  {WEEK_DAY_LABELS[day]}
                </span>

                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  {daySlots.length === 0 ? (
                    <span className="pt-1.5 text-xs text-muted">Cerrado</span>
                  ) : (
                    daySlots.map((slot, index) => (
                      <div key={`${day}-${index}`} className="flex flex-wrap items-center gap-2">
                        <label className="flex items-center gap-1.5 text-xs text-muted">
                          <span className="sr-only">{`${WEEK_DAY_LABELS[day]}: abre`}</span>
                          <span aria-hidden="true">De</span>
                          <input
                            type="time"
                            value={toTimeInput(slot.opens)}
                            aria-label={`${WEEK_DAY_LABELS[day]}: abre`}
                            onChange={(event) =>
                              replaceSlot(slot, { opens: toApiTime(event.target.value) })
                            }
                            className="h-9 rounded-lg border border-border bg-surface px-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orbita-500"
                          />
                        </label>
                        <label className="flex items-center gap-1.5 text-xs text-muted">
                          <span aria-hidden="true">a</span>
                          <input
                            type="time"
                            value={toTimeInput(slot.closes)}
                            aria-label={`${WEEK_DAY_LABELS[day]}: cierra`}
                            onChange={(event) =>
                              replaceSlot(slot, { closes: toApiTime(event.target.value) })
                            }
                            className="h-9 rounded-lg border border-border bg-surface px-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orbita-500"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => removeSlot(slot)}
                          aria-label={`Quitar la franja de ${WEEK_DAY_LABELS[day].toLowerCase()}`}
                          className="flex size-9 cursor-pointer items-center justify-center rounded-lg text-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orbita-500 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => addSlot(day)}
                  leadingIcon={<Plus className="size-4" aria-hidden="true" />}
                  className="self-start"
                >
                  <span className="sr-only">{`Agregar franja el ${WEEK_DAY_LABELS[day].toLowerCase()}`}</span>
                  <span aria-hidden="true">Agregar</span>
                </Button>
              </li>
            ))}
          </ul>
        </fieldset>
      ) : null}

      {error ? (
        <p role="alert" className="text-xs text-danger-fg">
          {error}
        </p>
      ) : null}

      <div className="flex justify-end border-t border-border pt-4">
        <Button size="sm" onClick={() => void save()} disabled={saving}>
          {saving ? "Guardando…" : "Guardar horario"}
        </Button>
      </div>
    </div>
  );
}
