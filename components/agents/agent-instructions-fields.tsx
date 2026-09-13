import { Input } from "@/components/ui/input";
import { RadioCardGroup } from "@/components/ui/radio-card-group";
import { Textarea } from "@/components/ui/textarea";
import {
  AGENT_INSTRUCTIONS_MAX_LENGTH,
  AGENT_NAME_MAX_LENGTH,
  AGENT_PERSONALITY_MAX_LENGTH,
  type SaveAiAgentRequest,
} from "@/lib/api/ai-agents";
import type { AgentDraftErrors } from "./agent-draft";
import { TONE_OPTIONS } from "./agent-format";
import { InstructionExamples } from "./instruction-examples";

export type AgentInstructionsFieldsProps = {
  draft: SaveAiAgentRequest;
  errors: AgentDraftErrors;
  onChange: (patch: Partial<SaveAiAgentRequest>) => void;
};

export function AgentInstructionsFields({ draft, errors, onChange }: AgentInstructionsFieldsProps) {
  return (
    <div className="flex flex-col gap-5">
      <Input
        name="agent-name"
        label="¿Cómo se llama tu asistente?"
        hint="Así se presenta con tus clientes."
        value={draft.name}
        maxLength={AGENT_NAME_MAX_LENGTH}
        error={errors.name}
        onChange={(event) => onChange({ name: event.target.value })}
      />
      <Textarea
        name="agent-personality"
        label="¿Cómo habla?"
        hint="Por ejemplo: cercana, habla de tú, con frases cortas."
        rows={3}
        value={draft.personality}
        maxLength={AGENT_PERSONALITY_MAX_LENGTH}
        error={errors.personality}
        onChange={(event) => onChange({ personality: event.target.value })}
      />
      <div className="flex flex-col gap-2">
        <Textarea
          name="agent-instructions"
          label="¿Qué hace y qué nunca debe hacer?"
          hint="Una idea por frase. Dile también cuándo pasar la conversación a una persona."
          rows={7}
          value={draft.instructions}
          maxLength={AGENT_INSTRUCTIONS_MAX_LENGTH}
          error={errors.instructions}
          onChange={(event) => onChange({ instructions: event.target.value })}
        />
        <InstructionExamples onUse={(text) => onChange({ instructions: text })} />
      </div>
      <RadioCardGroup
        name="agent-tone"
        legend="¿Qué tan creativo quieres que sea?"
        options={TONE_OPTIONS}
        value={draft.tone}
        onChange={(tone) => onChange({ tone })}
      />
    </div>
  );
}
