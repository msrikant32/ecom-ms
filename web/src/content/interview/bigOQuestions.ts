import type { InterviewQuestion } from "./types";

// Big O / complexity fundamentals — the existing DSA questions (round1.ts,
// round2.ts) jump straight into LeetCode-style problems and assume this
// foundation already exists. These fill that real gap, and are the content
// behind the interactive Big O playground at /algorithms.
export const bigOQuestions: InterviewQuestion[] = [
  {
    slug: "big-o-notation-fundamentals",
    question: "What is Big O notation, actually — and why do we drop constants and lower-order terms?",
    category: "DSA",
    round: "general",
    summary:
      "Big O describes how the number of operations grows as input size grows — the SHAPE of that growth, not a stopwatch measurement. Constants and lower-order terms get dropped because they become irrelevant compared to the dominant term once n is large enough, which is exactly the regime Big O is meant to describe.",
    intro: "The strongest answers explicitly separate 'what Big O measures' from 'how fast code runs' — conflating the two is the most common misunderstanding this question is checking for.",
    sections: [
      {
        heading: "What it actually measures",
        points: [
          {
            title: "Growth rate as a function of input size, not wall-clock speed",
            detail:
              "Two O(n) functions can have wildly different real-world speed (different constants, different hardware, different languages) — Big O doesn't capture that at all. What it captures is how the operation count SCALES as n grows: does doubling the input double the work (O(n)), quadruple it (O(n²)), or barely change it (O(log n))? That scaling behavior is what determines whether an algorithm is still usable at real-world scale, regardless of which machine it runs on.",
            relatedLink: { href: "/algorithms", label: "Watch six real complexity classes diverge live, as n grows" },
          },
        ],
      },
      {
        heading: "Why constants and lower-order terms get dropped",
        points: [
          {
            title: "They become insignificant next to the dominant term as n grows large",
            detail:
              "An algorithm doing exactly 3n + 7 operations is written as O(n), not O(3n + 7) — as n grows from 10 to 10,000,000, the +7 is completely swamped by the 3n term, and even the factor of 3 stops mattering when comparing against a fundamentally different growth shape like n². Big O describes the asymptotic behavior — what happens as n approaches infinity — where these details wash out.",
            code: `function example(arr) {
  console.log("start");        // 1 operation
  for (const x of arr) {       // n operations
    console.log(x);
  }
  console.log("end");          // 1 operation
}
// exactly 2 + n operations -> written as O(n), the constant 2 is dropped`,
            codeLanguage: "javascript",
          },
        ],
      },
    ],
    closingTip: "State the distinction explicitly if asked to define it: 'Big O describes how work scales with input size, not how fast the code actually runs — that's why constants and lower-order terms get dropped, they don't change the SHAPE of the growth curve, only its exact value at any one point.'",
  },
  {
    slug: "time-complexity-analysis-walkthrough",
    question: "Walk through how you'd actually determine a piece of code's time complexity, step by step.",
    category: "DSA",
    round: "general",
    summary:
      "Identify what varies with input size, count operations per relevant construct (a loop over n items contributes n; a nested loop over n items inside another multiplies), then combine — sequential blocks add, nested blocks multiply, and the dominant term wins.",
    intro: "The strongest answers apply a repeatable METHOD to unfamiliar code rather than pattern-matching against memorized examples — that method is exactly what this question is checking for.",
    sections: [
      {
        heading: "The method",
        points: [
          {
            title: "1. Identify what n actually is",
            detail: "The size of whatever input the code operates over — an array's length, a string's length, a number's magnitude. Different problems have different n's, and getting this wrong derails the whole analysis.",
          },
          {
            title: "2. Count operations per construct",
            detail: "A single loop over n items → O(n). A loop that halves the remaining range each iteration (like binary search) → O(log n). A constant-size operation (array index access, a fixed number of variable assignments) → O(1), regardless of n.",
          },
          {
            title: "3. Combine — sequential ADDS, nested MULTIPLIES",
            detail: "Two separate loops back to back, each O(n): O(n) + O(n) = O(2n) → simplifies to O(n). A loop inside another loop, both over the same n: O(n) × O(n) = O(n²) — for every outer iteration, the entire inner loop runs again.",
            code: `function example(arr) {
  for (const x of arr) console.log(x);   // O(n)
  for (const x of arr) console.log(x);   // O(n) — SEQUENTIAL, not nested
}
// O(n) + O(n) = O(2n) -> O(n)

function example2(arr) {
  for (const x of arr) {
    for (const y of arr) {               // NESTED inside the outer loop
      console.log(x, y);
    }
  }
}
// O(n) * O(n) = O(n^2)`,
            codeLanguage: "javascript",
          },
          {
            title: "4. Keep only the dominant term",
            detail: "If a function does O(n) work and then O(n²) work sequentially, the total is O(n + n²), which simplifies to O(n²) — the n² term dominates as n grows, so the smaller term is dropped in the final classification.",
          },
        ],
      },
    ],
    closingTip: "Narrate this method out loud when solving an unfamiliar problem live: 'what's n here, what loops touch it, are they nested or sequential' — interviewers are listening for the METHOD as much as the final answer.",
  },
  {
    slug: "space-complexity-and-tradeoffs",
    question: "What is space complexity, and how do time/space tradeoffs actually work in practice?",
    category: "DSA",
    round: "general",
    summary:
      "Space complexity measures EXTRA memory an algorithm uses beyond its input, as a function of n — the input itself doesn't count. Trading space for time (memoization being the classic example) is a real, deliberate design decision, not a free win, since the memory has to come from somewhere.",
    intro: "Naming a concrete example where the tradeoff ISN'T worth it (not just the classic memoization win) is what shows real judgment here, not just knowing memoization exists.",
    sections: [
      {
        heading: "What counts as space complexity",
        points: [
          {
            title: "Extra memory ALLOCATED by the algorithm, not the input itself",
            detail:
              "A function that scans an array and returns its max uses O(1) extra space — one variable tracking the current max, regardless of whether the array has 10 or 10 million elements. A function that builds and returns a new, same-size array uses O(n) extra space. Recursive calls also cost space — each call frame sits on the call stack until it returns, so a recursion that goes n levels deep uses O(n) space on the call stack alone, even if it allocates no other memory.",
          },
        ],
      },
      {
        heading: "The classic time/space tradeoff — memoization",
        points: [
          {
            title: "Trading O(n) space to turn O(2ⁿ) time into O(n) time",
            detail:
              "Naive recursive Fibonacci recomputes the same sub-problems exponentially many times — fib(5) recomputes fib(3) multiple times, fib(2) many more. Caching each computed result (memoization) means every distinct sub-problem is computed exactly once — O(n) time — at the cost of O(n) space to store the cache. An enormous, obviously worthwhile trade here.",
            code: `function fibMemo(n, cache = new Map()) {
  if (n <= 1) return n;
  if (cache.has(n)) return cache.get(n);       // O(1) space cost per entry, avoids recomputation
  const result = fibMemo(n - 1, cache) + fibMemo(n - 2, cache);
  cache.set(n, result);
  return result;
}
// O(2^n) time, O(1) extra space  -->  O(n) time, O(n) extra space`,
            codeLanguage: "javascript",
          },
        ],
      },
      {
        heading: "When the tradeoff genuinely isn't worth it",
        points: [
          {
            title: "When memory is the actual constraint, not time",
            detail:
              "Caching every result of a function called over a genuinely enormous or unbounded input space (not a small, bounded one like Fibonacci) can make the cache itself the bottleneck — consuming more memory than the system has, or evicting useful entries under pressure, potentially making things WORSE. Space-constrained environments (embedded systems, memory-limited containers) sometimes deliberately recompute rather than cache for exactly this reason. The tradeoff is a real decision made with actual constraints in mind, not an automatic win.",
          },
        ],
      },
    ],
    closingTip: "Close with the balanced framing: 'time/space tradeoffs are a real design decision — name which resource you're actually optimizing for and why, since more memory isn't free just because it makes something faster.'",
  },
  {
    slug: "best-worst-average-case-complexity",
    question: "Best case, worst case, average case — why does Big O in interviews almost always mean worst case?",
    category: "DSA",
    round: "general",
    summary:
      "The three cases are genuinely different questions about the same algorithm — worst case is the default in interviews because it's the GUARANTEE: the bound that holds no matter how unlucky or adversarial the input is, which is what you actually need to reason about correctness and reliability under real-world conditions.",
    intro: "Linear search is the cleanest concrete example to reach for here — the strongest answers use it (or something equally concrete) rather than defining the three cases purely abstractly.",
    sections: [
      {
        heading: "The three cases, made concrete",
        points: [
          {
            title: "Linear search: O(1) best, O(n) worst, O(n/2) → O(n) average",
            detail:
              "Best case: the target is the very first element checked — O(1). Worst case: the target is the last element, or not present at all — every element gets checked, O(n). Average case (assuming a uniform random position): roughly n/2 comparisons on average, which still simplifies to O(n) since constants are dropped.",
          },
        ],
      },
      {
        heading: "Why worst case is the interview default",
        points: [
          {
            title: "It's the guarantee, not a hope",
            detail:
              "Best case almost never tells you anything useful — it's rarely representative and easy to construct trivially. Worst case is the bound that holds NO MATTER WHAT the input looks like, which is exactly the property you need when reasoning about whether a system will hold up under real, possibly adversarial or unlucky traffic — a system that's fast on average but occasionally falls over on worst-case input is a real production risk, not just a theoretical curiosity.",
          },
          {
            title: "When average case is the more honest answer to give instead",
            detail:
              "Some algorithms have a worst case that's rare in practice and an average case that's much more representative of real usage — quicksort's worst case is O(n²) (a already-sorted or adversarially-chosen pivot sequence) but its average case is O(n log n) and that's what's actually observed in the overwhelming majority of real inputs. A strong answer names BOTH numbers for an algorithm like this, rather than only the worst case, since citing only O(n²) for quicksort without context undersells why it's used constantly in practice.",
          },
        ],
      },
    ],
    closingTip: "If asked to analyze an algorithm's complexity without qualification, state worst case by default AND say so explicitly ('worst case is O(n)') — that single word of precision is a real, easy signal of rigor.",
  },
  {
    slug: "amortized-time-complexity",
    question: "What is amortized time complexity? Walk through the dynamic array (array push) example.",
    category: "DSA",
    round: "general",
    summary:
      "An occasional expensive operation, averaged across a long sequence of cheap ones, can have a much better AMORTIZED cost per operation than its worst-case cost alone suggests — a dynamic array's push() is usually O(1) but occasionally O(n) on a resize, and amortized analysis shows the true average cost per push, across any long run, is still O(1).",
    intro: "This is a genuinely common source of confusion — the strongest answers explain why looking at the worst-case cost of a SINGLE push() in isolation gives a misleadingly pessimistic picture.",
    sections: [
      {
        heading: "The problem — push() looks worse than it actually is, in isolation",
        points: [
          {
            title: "Most pushes are O(1); occasionally one is O(n)",
            detail:
              "A dynamic array (JS arrays, effectively) has a backing buffer with some capacity. Pushing when there's spare capacity is O(1) — just write to the next slot. Pushing when the buffer is full triggers a resize: allocate a new, larger buffer (commonly double the size) and copy every existing element over — O(n). Taken in isolation, 'push is sometimes O(n)' sounds alarming — but that's not the whole picture.",
          },
        ],
      },
      {
        heading: "Why the AMORTIZED cost is still O(1)",
        points: [
          {
            title: "Spread the expensive resize across all the cheap pushes since the last one",
            detail:
              "If the buffer doubles each resize, resizes happen exponentially less often as the array grows — after a resize to capacity n, it takes n more pushes before the NEXT resize is needed. That one O(n) resize, spread across the n pushes that led up to needing it, averages out to O(1) extra work per push. Summing the total work across any long sequence of m pushes and dividing by m gives O(1) per push, even though a handful of individual pushes were genuinely O(n).",
            code: `// conceptually: total work for m pushes with doubling resizes
// resizes happen at sizes 1, 2, 4, 8, 16, ... up to m
// total resize cost = 1 + 2 + 4 + ... + m  ≈  2m  (a geometric series)
// total push cost (m O(1) pushes) = m
// total work = m + 2m = 3m  ->  3m / m = O(1) amortized per push`,
            codeLanguage: "javascript",
          },
        ],
      },
      {
        heading: "The key distinction to state precisely",
        points: [
          {
            title: "Amortized ≠ average case",
            detail:
              "Average case is about the distribution of INPUTS (what does typical input look like). Amortized is about the distribution of COST ACROSS A SEQUENCE OF OPERATIONS on the same structure over time — it's a guarantee about the total cost of m operations, divided by m, regardless of input distribution. These are answering genuinely different questions, and conflating them is a common, avoidable mistake.",
          },
        ],
      },
    ],
    closingTip: "The doubling-capacity detail is the part that makes this concrete: 'resizes happen exponentially less often as the array grows, so the total cost of all resizes across m pushes is still O(m) — meaning O(1) amortized per push, even though any single push can occasionally be O(n).'",
  },
];
