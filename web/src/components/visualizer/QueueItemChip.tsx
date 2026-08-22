import { motion } from "motion/react";

interface QueueItemChipProps {
  id: string;
  label: string;
  className: string;
}

/**
 * `layoutId` is tracked globally by Motion, not per-parent — so when an
 * item's id persists across steps but moves to a different panel's array
 * (e.g. a timer moving from Web APIs to the macrotask queue), Motion
 * automatically animates it sliding from its old screen position to its
 * new one instead of unmounting/remounting.
 */
export function QueueItemChip({ id, label, className }: QueueItemChipProps) {
  return (
    <motion.div
      layout
      layoutId={id}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ type: "spring", stiffness: 500, damping: 35 }}
      className={className}
    >
      {label}
    </motion.div>
  );
}
