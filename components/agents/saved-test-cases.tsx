import { Button } from "@/components/ui/button";
import { questionsOf, type AgentTestCase } from "@/lib/api/agent-test-bench";
import { Play, Trash2 } from "lucide-react";

export type SavedTestCasesProps = {
  cases: ReadonlyArray<AgentTestCase>;
  runningId: string | null;
  disabled: boolean;
  onRun: (testCase: AgentTestCase) => void;
  onDelete: (testCase: AgentTestCase) => void;
};

function formatQuestions(count: number): string {
  return count === 1 ? "1 pregunta" : `${count} preguntas`;
}

export function SavedTestCases({ cases, runningId, disabled, onRun, onDelete }: SavedTestCasesProps) {
  if (cases.length === 0) {
    return (
      <p className="text-xs text-muted">
        Cuando una conversación de prueba te sirva, guárdala como caso para repetirla después de
        cambiar algo.
      </p>
    );
  }

  return (
    <ul aria-label="Casos guardados" className="flex flex-col gap-2">
      {cases.map((testCase) => (
        <li
          key={testCase.id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2"
        >
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium text-foreground">{testCase.name}</span>
            <span className="text-xs text-muted">{formatQuestions(questionsOf(testCase).length)}</span>
          </span>
          <span className="flex items-center gap-1">
            <Button
              variant="secondary"
              size="sm"
              disabled={disabled}
              onClick={() => onRun(testCase)}
              leadingIcon={<Play className="size-4" aria-hidden="true" />}
            >
              {runningId === testCase.id ? "Probando…" : "Probar de nuevo"}
            </Button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onDelete(testCase)}
              aria-label={`Eliminar el caso ${testCase.name}`}
              className="flex size-9 cursor-pointer items-center justify-center rounded-lg text-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orbita-500 disabled:cursor-not-allowed"
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </button>
          </span>
        </li>
      ))}
    </ul>
  );
}
