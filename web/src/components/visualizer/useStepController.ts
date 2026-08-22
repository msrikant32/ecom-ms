import { useCallback, useEffect, useState } from "react";

const BASE_STEP_MS = 1400;

export interface StepController<T> {
  totalSteps: number;
  stepIndex: number;
  currentStep: T;
  isPlaying: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;
  speed: number;
  play: () => void;
  pause: () => void;
  stepForward: () => void;
  stepBack: () => void;
  reset: () => void;
  seek: (index: number) => void;
  setSpeed: (speed: number) => void;
}

/**
 * Generic playback engine shared by every step-through visualizer in this
 * app (single-actor call-stack traces, multi-actor cluster/worker-thread
 * traces, ...). It only needs an array of steps — each visualizer supplies
 * its own step shape and panel components.
 */
export function useStepController<T>(steps: T[]): StepController<T> {
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  const lastIndex = steps.length - 1;
  const isLastStep = stepIndex >= lastIndex;

  // Both setState calls below run inside the timeout callback, not
  // synchronously in the effect body, so they're deferred reactions to a
  // timer firing rather than a render-time state adjustment.
  useEffect(() => {
    if (!isPlaying || isLastStep) return;
    const id = setTimeout(() => {
      const next = Math.min(stepIndex + 1, lastIndex);
      setStepIndex(next);
      if (next >= lastIndex) setIsPlaying(false);
    }, BASE_STEP_MS / speed);
    return () => clearTimeout(id);
  }, [isPlaying, isLastStep, speed, stepIndex, lastIndex]);

  const play = useCallback(() => {
    setStepIndex((i) => (i >= lastIndex ? 0 : i));
    setIsPlaying(true);
  }, [lastIndex]);
  const pause = useCallback(() => setIsPlaying(false), []);
  const stepForward = useCallback(() => {
    setIsPlaying(false);
    setStepIndex((i) => Math.min(i + 1, lastIndex));
  }, [lastIndex]);
  const stepBack = useCallback(() => {
    setIsPlaying(false);
    setStepIndex((i) => Math.max(i - 1, 0));
  }, []);
  const reset = useCallback(() => {
    setIsPlaying(false);
    setStepIndex(0);
  }, []);
  const seek = useCallback(
    (index: number) => {
      setIsPlaying(false);
      setStepIndex(Math.min(Math.max(index, 0), lastIndex));
    },
    [lastIndex]
  );

  return {
    totalSteps: steps.length,
    stepIndex,
    currentStep: steps[stepIndex],
    isPlaying,
    isFirstStep: stepIndex === 0,
    isLastStep,
    speed,
    play,
    pause,
    stepForward,
    stepBack,
    reset,
    seek,
    setSpeed,
  };
}
