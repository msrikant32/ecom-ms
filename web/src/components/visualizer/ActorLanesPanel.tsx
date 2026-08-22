import type { Actor, ActorState } from "@/lib/trace/multiActorTypes";
import { ActorLane } from "./ActorLane";

export function ActorLanesPanel({
  actors,
  actorStates,
}: {
  actors: Actor[];
  actorStates: ActorState[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {actors.map((actor) => {
        const state = actorStates.find((s) => s.actorId === actor.id);
        if (!state) return null;
        return <ActorLane key={actor.id} actor={actor} state={state} />;
      })}
    </div>
  );
}
