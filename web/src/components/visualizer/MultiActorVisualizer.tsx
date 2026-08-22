"use client";

import { LayoutGroup } from "motion/react";
import type { MultiActorTrace } from "@/lib/trace/multiActorTypes";
import { useStepController } from "./useStepController";
import { CodePanel } from "./CodePanel";
import { ActorLanesPanel } from "./ActorLanesPanel";
import { MessageChannelPanel } from "./MessageChannelPanel";
import { ConsolePanel } from "./ConsolePanel";
import { Controls } from "./Controls";

export function MultiActorVisualizer({ trace }: { trace: MultiActorTrace }) {
  const controller = useStepController(trace.steps);
  const step = controller.currentStep;

  return (
    <LayoutGroup id={trace.id}>
      <div className="flex flex-col gap-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-zinc-100">
        <div className="grid gap-4 lg:grid-cols-2">
          <CodePanel
            code={trace.sourceCode}
            activeLine={step.line}
            activeLineEnd={step.lineEnd}
          />
          <div className="flex flex-col gap-3">
            <ActorLanesPanel actors={trace.actors} actorStates={step.actorStates} />
            <MessageChannelPanel
              messages={step.inFlightMessages}
              actors={trace.actors}
            />
          </div>
        </div>
        <ConsolePanel lines={step.consoleLines} />
        <Controls controller={controller} />
      </div>
    </LayoutGroup>
  );
}
