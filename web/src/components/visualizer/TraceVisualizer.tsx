"use client";

import { LayoutGroup } from "motion/react";
import type { Trace } from "@/lib/trace/types";
import { useStepController } from "./useStepController";
import { CodePanel } from "./CodePanel";
import { StackPanel } from "./StackPanel";
import { WebApisPanel } from "./WebApisPanel";
import { MicrotaskQueuePanel } from "./MicrotaskQueuePanel";
import { MacrotaskQueuePanel } from "./MacrotaskQueuePanel";
import { ConsolePanel } from "./ConsolePanel";
import { Controls } from "./Controls";

export function TraceVisualizer({ trace }: { trace: Trace }) {
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
          <div className="grid gap-3 sm:grid-cols-2">
            <StackPanel frames={step.callStack} />
            <WebApisPanel items={step.webApis} />
            <MicrotaskQueuePanel items={step.microtaskQueue} />
            <MacrotaskQueuePanel items={step.macrotaskQueue} />
          </div>
        </div>
        <ConsolePanel lines={step.consoleLines} />
        <Controls controller={controller} />
      </div>
    </LayoutGroup>
  );
}
