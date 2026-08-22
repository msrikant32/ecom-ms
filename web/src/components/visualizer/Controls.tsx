import type { StepController } from "./useStepController";

const SPEEDS = [0.5, 1, 1.5, 2];

const btnClass =
  "rounded-md border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-transparent";
const primaryBtnClass =
  "rounded-md bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-500";

export function Controls<T extends { narration: string }>({
  controller,
}: {
  controller: StepController<T>;
}) {
  const {
    isPlaying,
    play,
    pause,
    stepBack,
    stepForward,
    reset,
    isFirstStep,
    isLastStep,
    seek,
    stepIndex,
    totalSteps,
    speed,
    setSpeed,
    currentStep,
  } = controller;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={reset} className={btnClass} aria-label="Reset">
          ⟲ Reset
        </button>
        <button
          onClick={stepBack}
          disabled={isFirstStep}
          className={btnClass}
          aria-label="Step back"
        >
          ◀ Step
        </button>
        {isPlaying ? (
          <button onClick={pause} className={primaryBtnClass} aria-label="Pause">
            ⏸ Pause
          </button>
        ) : (
          <button onClick={play} className={primaryBtnClass} aria-label="Play">
            ▶ {isLastStep ? "Replay" : "Play"}
          </button>
        )}
        <button
          onClick={stepForward}
          disabled={isLastStep}
          className={btnClass}
          aria-label="Step forward"
        >
          Step ▶
        </button>

        <div className="ml-auto flex items-center gap-1 text-xs text-zinc-400">
          Speed
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`rounded px-1.5 py-0.5 ${
                speed === s ? "bg-sky-500/20 text-sky-300" : "hover:bg-zinc-800"
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      <input
        type="range"
        min={0}
        max={totalSteps - 1}
        value={stepIndex}
        onChange={(e) => seek(Number(e.target.value))}
        className="w-full accent-sky-500"
        aria-label="Scrub through steps"
      />
      <p className="text-xs text-zinc-400">
        Step {stepIndex + 1} / {totalSteps} — {currentStep.narration}
      </p>
    </div>
  );
}
