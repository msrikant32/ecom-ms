export interface ComplexityClass {
  id: string;
  label: string;
  colorClass: string;
  barColorClass: string;
  example: string;
  code: string;
  /** Simulated operation count for a given input size n. */
  operations: (n: number) => number;
}

export const COMPLEXITY_CLASSES: ComplexityClass[] = [
  {
    id: "constant",
    label: "O(1) — constant",
    colorClass: "text-emerald-600 dark:text-emerald-400",
    barColorClass: "bg-emerald-500",
    example: "Read the first element of an array",
    code: `function first(arr) {\n  return arr[0]; // always exactly 1 operation, regardless of arr's length\n}`,
    operations: () => 1,
  },
  {
    id: "logarithmic",
    label: "O(log n) — logarithmic",
    colorClass: "text-sky-600 dark:text-sky-400",
    barColorClass: "bg-sky-500",
    example: "Binary search a sorted array",
    code: `function binarySearch(sorted, target) {\n  let lo = 0, hi = sorted.length - 1;\n  while (lo <= hi) {\n    const mid = (lo + hi) >> 1;\n    if (sorted[mid] === target) return mid;\n    if (sorted[mid] < target) lo = mid + 1; else hi = mid - 1;\n  } // each step HALVES the remaining search space\n  return -1;\n}`,
    operations: (n) => Math.max(1, Math.ceil(Math.log2(Math.max(n, 1)))),
  },
  {
    id: "linear",
    label: "O(n) — linear",
    colorClass: "text-amber-600 dark:text-amber-400",
    barColorClass: "bg-amber-500",
    example: "Find the max value in an unsorted array",
    code: `function max(arr) {\n  let best = arr[0];\n  for (const x of arr) { // one pass — n operations\n    if (x > best) best = x;\n  }\n  return best;\n}`,
    operations: (n) => n,
  },
  {
    id: "linearithmic",
    label: "O(n log n) — linearithmic",
    colorClass: "text-orange-600 dark:text-orange-400",
    barColorClass: "bg-orange-500",
    example: "Merge sort / a well-implemented sort",
    code: `function mergeSort(arr) {\n  if (arr.length <= 1) return arr;\n  const mid = arr.length >> 1;\n  const left = mergeSort(arr.slice(0, mid));   // log n levels of splitting\n  const right = mergeSort(arr.slice(mid));      // n work merging at each level\n  return merge(left, right);\n}`,
    operations: (n) => Math.ceil(n * Math.max(1, Math.log2(Math.max(n, 1)))),
  },
  {
    id: "quadratic",
    label: "O(n²) — quadratic",
    colorClass: "text-rose-600 dark:text-rose-400",
    barColorClass: "bg-rose-500",
    example: "Nested loop — bubble sort, naive duplicate check",
    code: `function hasDuplicate(arr) {\n  for (let i = 0; i < arr.length; i++) {\n    for (let j = 0; j < arr.length; j++) { // n operations, n times each\n      if (i !== j && arr[i] === arr[j]) return true;\n    }\n  }\n  return false;\n}`,
    operations: (n) => n * n,
  },
  {
    id: "exponential",
    label: "O(2ⁿ) — exponential",
    colorClass: "text-red-600 dark:text-red-400",
    barColorClass: "bg-red-600",
    example: "Naive recursive Fibonacci (no memoization)",
    code: `function fib(n) {\n  if (n <= 1) return n;\n  return fib(n - 1) + fib(n - 2); // each call spawns 2 more — doubles per level\n}`,
    operations: (n) => Math.pow(2, n),
  },
];

/** log10-scaled, clamped to [0, 1] against the largest value currently on screen — keeps O(2^n) from crushing every other bar to invisible. */
export function scaledBarWidth(value: number, maxValue: number): number {
  if (maxValue <= 1) return value > 0 ? 100 : 0;
  const logValue = Math.log10(Math.max(value, 1));
  const logMax = Math.log10(maxValue);
  return logMax === 0 ? 100 : Math.min(100, (logValue / logMax) * 100);
}
