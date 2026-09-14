"use client";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import {
  formatSources,
  formatTestUsage,
  runAgentTest,
  TEST_MESSAGE_MAX_LENGTH,
  type AgentTestResult,
  type AgentTestTurn,
} from "@/lib/api/agent-test-bench";
import { toUserMessage } from "@/lib/api/errors";
import { cn } from "@/lib/cn";
import { RotateCcw, Send } from "lucide-react";
import { useState, type FormEvent } from "react";

const SUGGESTIONS = ["¿Cuánto cuesta?", "¿Hacen envíos?"] as const;

type Exchange = {
  question: string;
  result: AgentTestResult;
};

export type TestBenchPanelProps = {
  tenantId: string;
  agentId: string;
};

export function TestBenchPanel({ tenantId, agentId }: TestBenchPanelProps) {
  const { notify } = useToast();
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [message, setMessage] = useState("");
  const [asking, setAsking] = useState(false);

  const history: AgentTestTurn[] = exchanges.flatMap((exchange) => [
    { role: "User" as const, content: exchange.question },
    { role: "Assistant" as const, content: exchange.result.reply },
  ]);

  const ask = async (question: string) => {
    const trimmed = question.trim();
    if (trimmed.length === 0 || asking) {
      return;
    }
    setAsking(true);
    setMessage("");
    try {
      const result = await runAgentTest(tenantId, agentId, { message: trimmed, history });
      setExchanges((current) => [...current, { question: trimmed, result }]);
    } catch (error) {
      setMessage(trimmed);
      notify(toUserMessage(error), "error");
    } finally {
      setAsking(false);
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void ask(message);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted">
          Escríbele como lo haría un cliente. Nadie recibe estos mensajes.
        </p>
        <Button
          variant="secondary"
          size="sm"
          disabled={exchanges.length === 0 || asking}
          leadingIcon={<RotateCcw className="size-4" aria-hidden="true" />}
          onClick={() => setExchanges([])}
        >
          Reiniciar
        </Button>
      </div>

      <ol aria-label="Conversación de prueba" className="flex flex-col gap-4 rounded-xl bg-background p-4">
        {exchanges.length === 0 ? (
          <li className="text-center text-sm text-muted">
            Haz una pregunta para ver qué respondería y de dónde sacó la respuesta.
          </li>
        ) : null}
        {exchanges.map((exchange) => (
          <li key={`${exchange.question}-${exchange.result.usage.latencyMs}`} className="flex flex-col gap-2">
            <p className="max-w-[85%] self-start rounded-xl bg-surface px-3 py-2 text-sm text-foreground">
              {exchange.question}
            </p>
            <div className="flex max-w-[85%] flex-col gap-1 self-end">
              <p className="rounded-xl bg-info-bg px-3 py-2 text-sm text-foreground">{exchange.result.reply}</p>
              <TraceLine result={exchange.result} />
            </div>
          </li>
        ))}
        {asking ? (
          <li className="self-end text-xs text-muted" aria-live="polite">
            Pensando…
          </li>
        ) : null}
      </ol>

      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((suggestion) => (
          <Button
            key={suggestion}
            variant="secondary"
            size="sm"
            className="rounded-full"
            disabled={asking}
            onClick={() => void ask(suggestion)}
          >
            {suggestion}
          </Button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="flex items-center gap-2">
        <input
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          maxLength={TEST_MESSAGE_MAX_LENGTH}
          placeholder="Escribe una pregunta de prueba…"
          aria-label="Pregunta de prueba"
          className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-surface px-3 text-sm text-foreground placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orbita-500"
        />
        <Button
          type="submit"
          size="sm"
          disabled={asking || message.trim().length === 0}
          leadingIcon={<Send className="size-4" aria-hidden="true" />}
        >
          Enviar
        </Button>
      </form>
    </div>
  );
}

function TraceLine({ result }: { result: AgentTestResult }) {
  const sources = formatSources(result);
  const tools = result.toolCalls.map((call) => call.summary).join(" ");

  return (
    <p className={cn("flex flex-wrap items-center justify-end gap-x-2 gap-y-1 text-right text-xs text-muted")}>
      {result.testedDraft ? <StatusBadge tone="warning" label="Versión sin publicar" /> : null}
      {tools ? <span>{tools}</span> : null}
      {sources ? <span>{sources}</span> : null}
      <span>{formatTestUsage(result.usage)}</span>
    </p>
  );
}
