"use client";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import {
  deleteTestCase,
  formatSources,
  formatTestUsage,
  listTestCases,
  questionsOf,
  runAgentTest,
  saveTestCase,
  savedAnswers,
  TEST_CASES_MAX,
  TEST_MESSAGE_MAX_LENGTH,
  validateTestCase,
  type AgentTestCase,
  type AgentTestResult,
  type AgentTestTurn,
} from "@/lib/api/agent-test-bench";
import { toUserMessage } from "@/lib/api/errors";
import { cn } from "@/lib/cn";
import { Bookmark, RotateCcw, Send } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { SaveTestCaseModal } from "./save-test-case-modal";
import { SavedTestCases } from "./saved-test-cases";

const SUGGESTIONS = ["¿Cuánto cuesta?", "¿Hacen envíos?"] as const;

type Exchange = {
  question: string;
  result: AgentTestResult;
  /** Set when replaying a saved case: what the assistant answered back then, if anything. */
  previousReply?: string | null;
};

export type TestBenchPanelProps = {
  tenantId: string;
  agentId: string;
};

function toTurns(exchanges: ReadonlyArray<Exchange>): AgentTestTurn[] {
  return exchanges.flatMap((exchange) => [
    { role: "User" as const, content: exchange.question },
    { role: "Assistant" as const, content: exchange.result.reply },
  ]);
}

export function TestBenchPanel({ tenantId, agentId }: TestBenchPanelProps) {
  const { notify } = useToast();
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [message, setMessage] = useState("");
  const [asking, setAsking] = useState(false);
  const [cases, setCases] = useState<AgentTestCase[]>([]);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [savingOpen, setSavingOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listTestCases(tenantId, agentId)
      .then((result) => {
        if (!cancelled) {
          setCases(result);
        }
      })
      // Saved cases are a convenience: without them the bench still works, so fail quietly.
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [tenantId, agentId]);

  const busy = asking || runningId !== null;
  const history = toTurns(exchanges);
  const full = cases.length >= TEST_CASES_MAX;

  const ask = async (question: string) => {
    const trimmed = question.trim();
    if (trimmed.length === 0 || busy) {
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

  // Asks every saved question again against the assistant as it is now, threading the new
  // answers as history so the replay is the conversation a customer would have today.
  const runCase = async (testCase: AgentTestCase) => {
    if (busy) {
      return;
    }
    const questions = questionsOf(testCase);
    const previous = savedAnswers(testCase);
    setRunningId(testCase.id);
    setExchanges([]);
    const replayed: Exchange[] = [];
    try {
      for (const [index, question] of questions.entries()) {
        const result = await runAgentTest(tenantId, agentId, {
          message: question,
          history: toTurns(replayed),
        });
        replayed.push({ question, result, previousReply: previous[index] });
        setExchanges([...replayed]);
      }
    } catch (error) {
      notify(toUserMessage(error), "error");
    } finally {
      setRunningId(null);
    }
  };

  const saveCase = async (name: string) => {
    try {
      const saved = await saveTestCase(tenantId, agentId, { name, messages: history });
      setCases((current) => [...current, saved]);
      notify(`Guardamos «${saved.name}». Pruébalo de nuevo cuando cambies algo.`, "success");
    } catch (error) {
      notify(toUserMessage(error), "error");
      throw error;
    }
  };

  const removeCase = async (testCase: AgentTestCase) => {
    try {
      await deleteTestCase(tenantId, agentId, testCase.id);
      setCases((current) => current.filter((item) => item.id !== testCase.id));
    } catch (error) {
      notify(toUserMessage(error), "error");
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
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={exchanges.length === 0 || busy || full}
            title={full ? `Ya tienes ${TEST_CASES_MAX} casos guardados. Elimina alguno para guardar otro.` : undefined}
            leadingIcon={<Bookmark className="size-4" aria-hidden="true" />}
            onClick={() => setSavingOpen(true)}
          >
            Guardar como caso
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={exchanges.length === 0 || busy}
            leadingIcon={<RotateCcw className="size-4" aria-hidden="true" />}
            onClick={() => setExchanges([])}
          >
            Reiniciar
          </Button>
        </div>
      </div>

      <section aria-label="Casos guardados" className="flex flex-col gap-2">
        <h3 className="text-[11px] font-semibold tracking-wider text-muted uppercase">
          Casos guardados{cases.length > 0 ? ` · ${cases.length} de ${TEST_CASES_MAX}` : null}
        </h3>
        <SavedTestCases
          cases={cases}
          runningId={runningId}
          disabled={busy}
          onRun={(testCase) => void runCase(testCase)}
          onDelete={(testCase) => void removeCase(testCase)}
        />
      </section>

      <ol aria-label="Conversación de prueba" className="flex flex-col gap-4 rounded-xl bg-background p-4">
        {exchanges.length === 0 && !busy ? (
          <li className="text-center text-sm text-muted">
            Haz una pregunta para ver qué respondería y de dónde sacó la respuesta.
          </li>
        ) : null}
        {exchanges.map((exchange, index) => (
          <li key={`${index}-${exchange.question}`} className="flex flex-col gap-2">
            <p className="max-w-[85%] self-start rounded-xl bg-surface px-3 py-2 text-sm text-foreground">
              {exchange.question}
            </p>
            <div className="flex max-w-[85%] flex-col gap-1 self-end">
              <p className="rounded-xl bg-info-bg px-3 py-2 text-sm text-foreground">{exchange.result.reply}</p>
              <TraceLine result={exchange.result} />
              <PreviousReply exchange={exchange} />
            </div>
          </li>
        ))}
        {busy ? (
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
            disabled={busy}
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
          disabled={runningId !== null}
          className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-surface px-3 text-sm text-foreground placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orbita-500"
        />
        <Button
          type="submit"
          size="sm"
          disabled={busy || message.trim().length === 0}
          leadingIcon={<Send className="size-4" aria-hidden="true" />}
        >
          Enviar
        </Button>
      </form>

      <SaveTestCaseModal
        open={savingOpen}
        onClose={() => setSavingOpen(false)}
        onSubmit={saveCase}
        validate={(name) => validateTestCase(name, history)}
      />
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

/**
 * Shows what the case recorded, without claiming why it differs: the model words the same
 * answer differently from one run to the next, so "it changed" would often be false.
 */
function PreviousReply({ exchange }: { exchange: Exchange }) {
  if (exchange.previousReply === undefined) {
    return null;
  }
  if (exchange.previousReply === null) {
    return <p className="text-right text-xs text-muted">Cuando guardaste el caso, esta pregunta no tenía respuesta.</p>;
  }
  if (exchange.previousReply === exchange.result.reply) {
    return <p className="text-right text-xs text-muted">Igual que cuando guardaste el caso.</p>;
  }
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs text-muted">
      <span className="font-semibold text-foreground">Al guardar el caso respondió:</span>{" "}
      {exchange.previousReply}
    </div>
  );
}
