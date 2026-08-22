import type { InterviewQuestion } from "./types";

export const round1Questions: InterviewQuestion[] = [
  {
    slug: "js-fundamentals",
    question:
      "Explain Closures, Event Loop, Hoisting, Prototypes, Async/Await, Promises, and var vs let vs const.",
    category: "JavaScript",
    round: "round-1",
    summary:
      "Seven core JS fundamentals in one question — the interviewer is checking breadth. Several of these already have interactive visualizations elsewhere on this site.",
    intro:
      "This is a breadth check, not a depth check on any one topic — answer each concisely and correctly rather than picking one to go deep on. A few of these (the event loop, promises, async/await) are exactly what the Node.js Core Concepts module on this site visualizes step by step; link there if you want to actually watch the mechanics instead of just reading about them.",
    sections: [
      {
        heading: "Closures",
        points: [
          {
            title: "A function plus the scope it was created in",
            detail:
              "A closure is a function bundled with references to the variables from its enclosing scope, which it keeps access to even after that outer function has returned. This is what makes private state possible in JS without classes.",
            code: `function makeCounter() {
  let count = 0; // private — not accessible from outside
  return {
    increment: () => ++count,
    value: () => count,
  };
}

const counter = makeCounter();
counter.increment();
counter.increment();
counter.value(); // 2 — 'count' is still alive, captured by the closure`,
          },
          {
            title: "The classic var-in-a-loop gotcha",
            detail:
              "var is function-scoped, so all iterations of a loop share ONE binding — every closure captures the same final value. let is block-scoped, so each iteration gets its own fresh binding, which is almost always what you actually want.",
            code: `for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}
// logs 3, 3, 3 — all three closures share the same 'i'

for (let j = 0; j < 3; j++) {
  setTimeout(() => console.log(j), 0);
}
// logs 0, 1, 2 — each closure gets its own 'j'`,
            relatedLink: {
              href: "/interview/var-vs-let-settimeout-loop",
              label: "Full breakdown of this exact question, including the event-loop timing",
            },
          },
        ],
      },
      {
        heading: "Event Loop",
        points: [
          {
            title: "How JS runs async code on a single thread",
            detail:
              "The call stack runs synchronous code to completion first; only once it's empty does the event loop pull work from the microtask queue (promise callbacks — fully drained first) and then the macrotask queue (setTimeout, I/O callbacks). This is why a 0ms setTimeout still runs after all synchronous code, and why a Promise.then() callback always beats a setTimeout(fn, 0) — no matter how deep or fast either look on paper.",
            relatedLink: {
              href: "/topics/event-loop",
              label: "Watch it step by step: The Event Loop visualization on this site",
            },
          },
        ],
      },
      {
        heading: "Hoisting",
        points: [
          {
            title: "Declarations are processed before code runs — but differently per keyword",
            detail:
              "var declarations are hoisted and initialized to undefined immediately, so reading one before its line just gives undefined, not an error. let/const are hoisted too, but left in the 'temporal dead zone' until their declaration line actually executes — reading them before that throws a ReferenceError. Function declarations are hoisted whole, body included, so you can call one before it appears in the file; function expressions and arrow functions are not (only the variable they're assigned to follows normal var/let/const hoisting rules).",
            code: `console.log(a); // undefined (var hoisted, not yet assigned)
var a = 1;

console.log(b); // ReferenceError: Cannot access 'b' before initialization
let b = 2;

sayHi(); // "hi" — function declarations hoist with their full body
function sayHi() { console.log('hi'); }`,
          },
        ],
      },
      {
        heading: "Prototypes",
        points: [
          {
            title: "How JS does inheritance without real classes",
            detail:
              "Every object has an internal [[Prototype]] link to another object (or null); a property/method lookup that misses on the object itself walks up this chain until it's found or the chain ends. class syntax is sugar over exactly this mechanism — methods defined in a class body land on the prototype, not on each instance, so they're shared rather than duplicated per object.",
            code: `const animal = { speak() { return 'generic sound'; } };
const dog = Object.create(animal); // dog's prototype is 'animal'
dog.speak(); // 'generic sound' — found via the prototype chain

dog.speak = function () { return 'woof'; }; // own property shadows the prototype's
dog.speak(); // 'woof'`,
          },
        ],
      },
      {
        heading: "Promises",
        points: [
          {
            title: "A placeholder for a value that isn't ready yet",
            detail:
              "Three states: pending → fulfilled or rejected, and once settled it never changes again. .then/.catch/.finally attach callbacks; chaining .then() calls flattens even when a handler returns another promise. Promise.all rejects as soon as any one rejects; Promise.allSettled always waits for every one and reports each outcome; Promise.race/Promise.any settle on the first to settle/fulfill respectively.",
            relatedLink: {
              href: "/topics/promises",
              label: "Watch the microtask queue in action: Promises visualization on this site",
            },
          },
        ],
      },
      {
        heading: "Async/Await",
        points: [
          {
            title: "Syntactic sugar over promises, not a different concurrency model",
            detail:
              "await pauses only the async function it's inside of at that point — the rest of the program keeps running. Under the hood the function's continuation after await is scheduled as a microtask, exactly like a .then() callback. try/catch around an await is how you handle rejections, equivalent to .catch() on the promise chain.",
            relatedLink: {
              href: "/topics/async-await",
              label: "Watch a function actually suspend and resume: Async/Await visualization on this site",
            },
          },
        ],
      },
      {
        heading: "var vs let vs const",
        points: [
          {
            title: "Scope, hoisting behavior, and reassignability all differ",
            detail:
              "var: function-scoped, hoisted and initialized to undefined, can be redeclared in the same scope. let: block-scoped, hoisted into a temporal dead zone, reassignable, cannot be redeclared in the same block. const: same block-scoping/TDZ as let, but the BINDING can't be reassigned — an object or array declared with const is still mutable (you can push/set properties), you just can't point the variable at a different object.",
            code: `const obj = { a: 1 };
obj.a = 2;      // fine — mutating the object, not reassigning the binding
obj.a = 2;
// obj = {};    // TypeError: Assignment to constant variable.`,
          },
        ],
      },
    ],
    closingTip:
      "If time is short, prioritize explaining the event loop and closures correctly with a concrete example each — those two come up as follow-up 'why does this log X' questions more than any of the others.",
  },
  {
    slug: "react-fundamentals",
    question:
      "Explain React Hooks, Custom Hooks, Virtual DOM, Reconciliation, React.memo, useMemo, useCallback, and Context API.",
    category: "React",
    round: "round-1",
    summary:
      "Another breadth question — know what each does, when to reach for it, and the one thing people usually get wrong about it.",
    intro:
      "Same shape as the JS fundamentals question: cover each briefly and correctly. The three memoization tools (React.memo/useMemo/useCallback) are the ones interviewers most often follow up on — be ready to explain what specifically each one memoizes, since that's the actual distinction between them.",
    sections: [
      {
        heading: "Hooks",
        points: [
          {
            title: "Let function components use state and lifecycle features",
            detail:
              "Before hooks, only class components could hold state or run code on mount/update/unmount. Hooks (useState, useEffect, useContext, useRef, ...) bring that into function components. The rule of hooks: call them only at the top level (never inside conditions/loops) and only from React functions, so React can rely on the same call order every render to match hook state to the right hook.",
          },
        ],
      },
      {
        heading: "Custom Hooks",
        points: [
          {
            title: "A function starting with 'use' that composes built-in hooks",
            detail:
              "Extracts and shares stateful LOGIC between components — not shared state itself. Two components calling the same custom hook each get their own independent instance of that state, the same way two components calling useState each get their own state.",
            code: `function useDebouncedValue(value, delayMs) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}
// usage: const debouncedSearch = useDebouncedValue(searchInput, 300);`,
          },
        ],
      },
      {
        heading: "Virtual DOM & Reconciliation",
        points: [
          {
            title: "A lightweight JS tree, diffed instead of touching the real DOM directly",
            detail:
              "The Virtual DOM is a plain JS object tree describing what the UI should look like. On every render, React builds a new one and diffs it against the previous tree (reconciliation) to compute the minimal set of real DOM mutations, instead of re-rendering everything. Elements of the same type are compared prop-by-prop and patched in place; elements of a different type cause React to tear down and rebuild that whole subtree.",
          },
          {
            title: "Why keys matter in lists",
            detail:
              "Without a stable key, React matches list children by position, so inserting/removing an item in the middle of a list can cause React to think EVERY item after it changed, patching more than necessary or (worse) mismatching component state to the wrong item. A stable, unique key (not the array index, if the list can reorder) lets React match old and new elements correctly across renders.",
          },
        ],
      },
      {
        heading: "React.memo, useMemo, useCallback",
        points: [
          {
            title: "Three memoization tools, each for a different kind of value",
            detail:
              "React.memo wraps a COMPONENT: skip re-rendering it if its props are shallow-equal to last time. useMemo memoizes a computed VALUE across renders, recomputing only when its dependency array changes — for expensive calculations. useCallback memoizes a FUNCTION's identity across renders — without it, an inline function prop is a new reference every render, which defeats React.memo on a child that receives it (since 'shallow equal props' fails on a function that's technically new every time).",
            code: `const ExpensiveList = React.memo(function ExpensiveList({ items, onSelect }) {
  /* only re-renders if items or onSelect actually change reference */
});

function Parent({ items }) {
  // without useCallback, this is a NEW function every render,
  // defeating ExpensiveList's React.memo
  const handleSelect = useCallback((id) => console.log(id), []);
  const sorted = useMemo(() => [...items].sort(), [items]);
  return <ExpensiveList items={sorted} onSelect={handleSelect} />;
}`,
          },
          {
            title: "The common mistake: memoizing everything",
            detail:
              "useMemo/useCallback aren't free — they cost a dependency-array comparison every render. Reach for them when profiling shows an actual expensive render or a broken React.memo downstream, not reflexively on every value and function.",
          },
        ],
      },
      {
        heading: "Context API",
        points: [
          {
            title: "Avoids prop drilling for data many components need",
            detail:
              "A Provider supplies a value to the tree; any descendant can read it with useContext without it being threaded through every intermediate component's props. The tradeoff: every consumer re-renders whenever the Provider's value changes, even if a given consumer only cares about part of it — a common perf trap in larger apps, usually fixed by splitting one big context into several narrower ones, or pairing Context with useMemo on the value object so it doesn't get a new reference every render.",
          },
        ],
      },
    ],
    closingTip:
      "If asked to compare useMemo and useCallback directly: useCallback(fn, deps) is just useMemo(() => fn, deps) — same mechanism, useCallback is a convenience wrapper specifically for the 'memoize a function' case.",
  },
  {
    slug: "build-product-management-app",
    question:
      "Build a Product Management application with Login, CRUD, Search, Pagination, Filtering, and API Integration.",
    category: "React",
    round: "round-1",
    summary:
      "A full-stack build question. Rather than duplicate a second CRUD app, here's the architecture approach — and every one of these pieces already exists, working, elsewhere in this repo.",
    intro:
      "This is really six smaller questions bundled into one 'build it' prompt. The honest, efficient answer in an interview is to describe the architecture for each piece and demonstrate you understand the tradeoffs — not to write a whole app from scratch on a whiteboard. This repo already has working, running implementations of most of these pieces; the sections below explain the approach and point to the real code.",
    sections: [
      {
        heading: "Overall architecture",
        points: [
          {
            title: "Thin pages, a dedicated API layer, shared auth state",
            detail:
              "Page/route components stay focused on layout and composition. All HTTP calls go through a small typed API client module (one function per endpoint, not fetch() scattered through components) so the request shape, error handling, and auth header attachment live in exactly one place.",
            sourceRef: "web/src/lib/upload/api.ts is exactly this pattern, just for a different feature",
          },
        ],
      },
      {
        heading: "Login",
        points: [
          {
            title: "Token-based auth against a real backend",
            detail:
              "POST credentials to a login endpoint, receive a short-lived access token, hold it in memory/state (not localStorage, to limit XSS exposure), attach it as an Authorization: Bearer header on every subsequent request.",
            relatedLink: {
              href: "/upload",
              label: "This exact flow, working: the login form on the Large File Upload demo",
            },
            sourceRef: "express-production-api/src/controllers/authController.js + services/authService.js",
          },
        ],
      },
      {
        heading: "CRUD",
        points: [
          {
            title: "List / Create / Update / Delete against a REST resource",
            detail:
              "Standard REST verbs (GET list, GET one, POST create, PATCH/PUT update, DELETE), with either an optimistic UI update or a refetch-after-mutation to keep the client in sync with the server's source of truth.",
            sourceRef:
              "express-production-api/src/controllers/productController.js + services/productService.js already implement this backend",
          },
        ],
      },
      {
        heading: "Search",
        points: [
          {
            title: "Server-side, not client-side, once the dataset is non-trivial",
            detail:
              "A ?search= query param on the list endpoint that the server applies before pagination — client-side filtering only works correctly if you've already fetched the entire dataset, which defeats pagination entirely.",
          },
        ],
      },
      {
        heading: "Pagination",
        points: [
          {
            title: "Offset vs cursor — this repo has both, on purpose",
            detail:
              "Offset pagination (?page=&limit=) is simple and supports 'jump to page N'; cursor pagination (?cursor=&limit=) scales better and stays correct even if rows are inserted/deleted while a user is paging through, at the cost of losing random page access.",
            sourceRef:
              "express-production-api/src/utils/pagination.js — offset used on GET /products, cursor on GET /orders",
          },
        ],
      },
      {
        heading: "Filtering",
        points: [
          {
            title: "Validated query parameters, applied server-side before pagination",
            detail:
              "e.g. ?category=&minPrice=&maxPrice=, validated with the same express-validator + validate-middleware pattern used elsewhere, so a malformed filter fails fast with a 400 instead of silently returning nothing or crashing the query.",
            sourceRef: "express-production-api/src/middleware/validate.js",
          },
        ],
      },
      {
        heading: "API Integration",
        points: [
          {
            title: "Centralized client, consistent error handling",
            detail:
              "One place that knows the base URL, attaches auth headers, and turns a non-2xx response into a thrown Error with a readable message — so every calling component gets the same error-handling shape instead of reimplementing fetch() parsing everywhere.",
          },
        ],
      },
    ],
    closingTip:
      "Naming the offset-vs-cursor pagination tradeoff unprompted is a strong signal in this kind of question — most candidates only know one exists.",
  },
  {
    slug: "redux-protected-routes-perf",
    question:
      "Explain Redux Toolkit, RTK Query, Protected Routes, Error Boundaries, and React performance optimization.",
    category: "React",
    round: "round-1",
    summary:
      "State management, data fetching, route guarding, and failure isolation — four different concerns that often get conflated.",
    intro:
      "These five topics span state management, data fetching, routing, and error handling — resist the urge to blur them together (a common mistake is describing RTK Query as 'just Redux', when its whole point is that you often don't need hand-written Redux state for server data at all).",
    sections: [
      {
        heading: "Redux Toolkit",
        points: [
          {
            title: "The opinionated, modern way to write Redux",
            detail:
              "createSlice bundles reducers and their matching action creators in one place instead of hand-writing action types/creators/reducers separately. configureStore sets up sane defaults (Redux DevTools, thunk middleware, dev-only immutability/serializability checks). Under the hood, reducers use Immer, so you write code that LOOKS like it's mutating state (state.count++) but Immer produces a proper immutable update.",
          },
        ],
      },
      {
        heading: "RTK Query",
        points: [
          {
            title: "A data-fetching/caching layer built into Redux Toolkit",
            detail:
              "createApi defines endpoints declaratively; RTK Query auto-generates hooks (useGetProductsQuery, useCreateProductMutation) that handle loading/error states, caching, deduplication of identical in-flight requests, and cache invalidation via tags — largely replacing the older pattern of a thunk plus manual loading/error state plus a useEffect fetch.",
          },
        ],
      },
      {
        heading: "Protected Routes",
        points: [
          {
            title: "A route wrapper that checks auth before rendering",
            detail:
              "A component that reads auth state (from context/Redux) and either renders its children/an <Outlet/> (React Router v6) or redirects to /login — centralizing the check instead of repeating an if-not-authenticated-redirect in every protected page.",
            code: `function ProtectedRoute({ isAuthenticated }) {
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
// <Route element={<ProtectedRoute isAuthenticated={...} />}>
//   <Route path="/dashboard" element={<Dashboard />} />
// </Route>`,
          },
        ],
      },
      {
        heading: "Error Boundaries",
        points: [
          {
            title: "Catch render-time errors in a subtree, show a fallback instead of a blank screen",
            detail:
              "Class components only (no hook equivalent exists yet) implementing static getDerivedStateFromError and/or componentDidCatch. They catch errors thrown during rendering, in lifecycle methods, and in constructors of their child tree — but explicitly NOT errors in event handlers, async code (a rejected promise), or server-side rendering. Those need regular try/catch.",
          },
        ],
      },
      {
        heading: "React performance optimization",
        points: [
          {
            title: "Measure first, then apply the right tool",
            detail:
              "Profile with React DevTools' Profiler before optimizing blind — the same principle as backend performance work. Common levers: React.memo/useMemo/useCallback to skip unnecessary re-renders, virtualizing long lists (react-window/react-virtualized) so you only render visible rows, code-splitting routes, and avoiding inline object/array/function literals as props to memoized children (new reference every render defeats the memoization).",
          },
        ],
      },
    ],
    closingTip:
      "If asked 'when would you NOT use RTK Query': for data that's genuinely local/client-only UI state (a form's draft values, a modal's open/closed state) — that's plain useState/Redux slice territory, not server-cache territory.",
  },
  {
    slug: "react-app-optimization",
    question:
      "Optimize a React application using Lazy Loading, Code Splitting, Debouncing, Memoization, and API Caching.",
    category: "React",
    round: "round-1",
    summary:
      "Five concrete optimization techniques — know the mechanism behind each, not just the name.",
    intro:
      "This overlaps with the React performance section of the previous question but zooms into five specific, commonly-asked techniques. Be ready to explain the actual mechanism for each, not just define the term.",
    sections: [
      {
        heading: "Lazy Loading",
        points: [
          {
            title: "Defer loading a component's code until it's actually needed",
            detail:
              "React.lazy(() => import('./Modal')) plus a <Suspense fallback={...}> boundary around it — the component's JS chunk isn't fetched until the first time it's rendered. Ideal for things not needed on initial load: modals, rarely-visited routes, heavy below-the-fold widgets.",
            code: `const SettingsModal = React.lazy(() => import('./SettingsModal'));

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      {showSettings && <SettingsModal />}
    </Suspense>
  );
}`,
          },
        ],
      },
      {
        heading: "Code Splitting",
        points: [
          {
            title: "Breaking one big bundle into smaller, on-demand chunks",
            detail:
              "The bundler (webpack/Turbopack) creates a separate chunk at every dynamic import() boundary. Route-based splitting is the highest-leverage split point in most apps — a user visiting the homepage shouldn't have to download the code for the admin dashboard they'll never open.",
          },
        ],
      },
      {
        heading: "Debouncing",
        points: [
          {
            title: "Wait for a pause in events before reacting",
            detail:
              "For something like search-as-you-type, firing an API request on every keystroke wastes requests and can return results out of order. Debouncing delays the action until the user stops typing for N ms, so fast typing collapses into a single request. (Throttling is the related-but-different technique: guarantee at most one call per fixed interval, useful for things like scroll-position handlers that fire constantly regardless of pauses.)",
            code: `function useDebouncedCallback(fn, delayMs) {
  const timeoutRef = useRef(null);
  return useCallback((...args) => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => fn(...args), delayMs);
  }, [fn, delayMs]);
}`,
          },
        ],
      },
      {
        heading: "Memoization",
        points: [
          {
            title: "React.memo / useMemo / useCallback — skip redundant work",
            detail:
              "Covered in depth in the React fundamentals question — the short version here: memoize the expensive computation or the component that's actually shown as slow in the Profiler, not everything reflexively.",
            relatedLink: {
              href: "/interview/react-fundamentals",
              label: "Full explanation: React fundamentals — React.memo, useMemo, useCallback",
            },
          },
        ],
      },
      {
        heading: "API Caching",
        points: [
          {
            title: "Don't re-fetch data you already have",
            detail:
              "React Query/SWR/RTK Query give this for free with stale-while-revalidate semantics: show cached data instantly while refetching in the background. It's worth mentioning this exists on the server side too — response caching (e.g. in Redis) means even a genuine cache-miss on the client can still be served fast by the API.",
            sourceRef: "express-production-api/src/middleware/cacheMiddleware.js",
          },
        ],
      },
    ],
    closingTip:
      "A good closing line for this question: 'I'd confirm with the Profiler which of these actually matters here before reaching for all five' — optimization work aimed at the wrong bottleneck doesn't move the needle.",
  },
  {
    slug: "two-sum",
    question: "Solve: Two Sum",
    category: "DSA",
    round: "round-1",
    summary: "Given an array and a target, find the indices of two numbers that add up to it. Classic hash-map warm-up problem.",
    intro:
      "Given an array of integers nums and an integer target, return the indices of the two numbers that add up to target. Assume exactly one solution exists, and you can't use the same element twice.",
    sections: [
      {
        heading: "Approach",
        points: [
          {
            title: "Brute force vs one-pass hash map",
            detail:
              "Brute force checks every pair — O(n²). The optimal approach scans once, and for each number checks whether its complement (target - current number) was already seen, using a hash map from value → index for O(1) lookups.",
          },
        ],
      },
      {
        heading: "Solution",
        points: [
          {
            title: "One-pass hash map",
            detail: "",
            code: `function twoSum(nums, target) {
  const seen = new Map(); // value -> index
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (seen.has(complement)) return [seen.get(complement), i];
    seen.set(nums[i], i);
  }
  return [];
}

twoSum([2, 7, 11, 15], 9); // [0, 1]`,
          },
        ],
      },
      {
        heading: "Complexity",
        points: [
          {
            title: "O(n) time, O(n) space",
            detail:
              "Single pass through the array; the hash map can hold up to n entries in the worst case.",
          },
        ],
      },
    ],
    closingTip:
      "If asked to return VALUES instead of indices, or to handle duplicates/multiple valid pairs, clarify the exact requirement before coding — this problem has several common variants.",
  },
  {
    slug: "longest-substring-without-repeating",
    question: "Solve: Longest Substring Without Repeating Characters",
    category: "DSA",
    round: "round-1",
    summary: "Find the length of the longest substring with no repeated characters. Sliding-window pattern.",
    intro:
      "Given a string s, find the length of the longest substring without repeating characters.",
    sections: [
      {
        heading: "Approach",
        points: [
          {
            title: "Sliding window with a last-seen-index map",
            detail:
              "Expand a window's right edge one character at a time. If that character was already seen INSIDE the current window, jump the window's left edge to just past its previous occurrence — don't reset left all the way to 0, or the algorithm degrades to O(n²). Track the max window size seen.",
          },
        ],
      },
      {
        heading: "Solution",
        points: [
          {
            title: "Sliding window",
            detail: "",
            code: `function lengthOfLongestSubstring(s) {
  const lastIndex = new Map(); // char -> most recent index
  let start = 0;
  let maxLen = 0;

  for (let end = 0; end < s.length; end++) {
    const ch = s[end];
    if (lastIndex.has(ch) && lastIndex.get(ch) >= start) {
      start = lastIndex.get(ch) + 1; // jump window start past the repeat
    }
    lastIndex.set(ch, end);
    maxLen = Math.max(maxLen, end - start + 1);
  }
  return maxLen;
}

lengthOfLongestSubstring('abcabcbb'); // 3 ("abc")`,
          },
        ],
      },
      {
        heading: "Complexity",
        points: [
          {
            title: "O(n) time, O(min(n, charset size)) space",
            detail: "Each character is visited a constant number of times; the map holds at most one entry per distinct character.",
          },
        ],
      },
    ],
    closingTip:
      "The bug to watch for: forgetting the '>= start' check when jumping the window — without it, a stale (out-of-window) previous index can incorrectly shrink the window.",
  },
  {
    slug: "product-of-array-except-self",
    question: "Solve: Product of Array Except Self",
    category: "DSA",
    round: "round-1",
    summary: "For each index, return the product of every other element — without using division. Prefix/suffix product pattern.",
    intro:
      "Given an array nums, return an array where each element at index i is the product of all elements except nums[i]. Must run in O(n) without using division.",
    sections: [
      {
        heading: "Approach",
        points: [
          {
            title: "Why not division",
            detail:
              "Dividing the total product by nums[i] is the obvious first idea, but it breaks if any element is 0 (and the problem explicitly disallows division anyway). The O(n), division-free approach: for each index, the answer is (product of everything to its left) × (product of everything to its right) — computed in two passes.",
          },
        ],
      },
      {
        heading: "Solution",
        points: [
          {
            title: "Prefix pass, then suffix pass",
            detail: "",
            code: `function productExceptSelf(nums) {
  const n = nums.length;
  const result = new Array(n).fill(1);

  let prefix = 1;
  for (let i = 0; i < n; i++) {
    result[i] = prefix;
    prefix *= nums[i];
  }

  let suffix = 1;
  for (let i = n - 1; i >= 0; i--) {
    result[i] *= suffix;
    suffix *= nums[i];
  }

  return result;
}

productExceptSelf([1, 2, 3, 4]); // [24, 12, 8, 6]`,
          },
        ],
      },
      {
        heading: "Complexity",
        points: [
          {
            title: "O(n) time, O(1) extra space",
            detail: "Two linear passes; the output array itself doesn't count toward the O(1) extra-space requirement.",
          },
        ],
      },
    ],
    closingTip:
      "Say out loud that division would be simpler but breaks on zeros — that's usually exactly what the interviewer is probing for by disallowing it.",
  },
  {
    slug: "merge-intervals",
    question: "Solve: Merge Intervals",
    category: "DSA",
    round: "round-1",
    summary: "Merge all overlapping intervals in a list. Sort-then-sweep pattern.",
    intro:
      "Given an array of intervals where intervals[i] = [start, end], merge all overlapping intervals and return the non-overlapping result.",
    sections: [
      {
        heading: "Approach",
        points: [
          {
            title: "Sort by start time, then sweep once",
            detail:
              "Once sorted by start, any interval that overlaps the current merged interval must immediately follow it in the sorted order — so a single left-to-right pass suffices. Merge into the last interval in the result whenever the next interval's start is ≤ the last merged interval's end.",
          },
        ],
      },
      {
        heading: "Solution",
        points: [
          {
            title: "Sort + sweep",
            detail: "",
            code: `function mergeIntervals(intervals) {
  if (intervals.length <= 1) return intervals;
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  const merged = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    const current = sorted[i];
    if (current[0] <= last[1]) {
      last[1] = Math.max(last[1], current[1]); // extend the merge
    } else {
      merged.push(current); // no overlap — start a new interval
    }
  }
  return merged;
}

mergeIntervals([[1,3],[2,6],[8,10],[15,18]]); // [[1,6],[8,10],[15,18]]`,
          },
        ],
      },
      {
        heading: "Complexity",
        points: [
          {
            title: "O(n log n) time, O(n) space",
            detail: "Dominated by the sort; the sweep itself is a single O(n) pass.",
          },
        ],
      },
    ],
    closingTip:
      "Watch the boundary condition: intervals that TOUCH (e.g. [1,3] and [3,5]) usually count as overlapping in this problem — using <= rather than < in the merge check is what handles that correctly.",
  },
  {
    slug: "group-anagrams",
    question: "Solve: Group Anagrams",
    category: "DSA",
    round: "round-1",
    summary: "Group strings that are anagrams of each other. Hash-map-with-a-canonical-key pattern.",
    intro:
      "Given an array of strings, group the anagrams together. Anagrams are words made of the same letters rearranged.",
    sections: [
      {
        heading: "Approach",
        points: [
          {
            title: "A canonical key that's identical for every anagram in a group",
            detail:
              "Anagrams share the same multiset of characters, so sorting a string's characters produces a key that's identical for every word in its anagram group. Bucket original strings into a map keyed by that sorted form.",
          },
        ],
      },
      {
        heading: "Solution",
        points: [
          {
            title: "Sorted-string key",
            detail: "",
            code: `function groupAnagrams(strs) {
  const groups = new Map();
  for (const str of strs) {
    const key = str.split('').sort().join('');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(str);
  }
  return [...groups.values()];
}

groupAnagrams(['eat','tea','tan','ate','nat','bat']);
// [['eat','tea','ate'], ['tan','nat'], ['bat']]`,
          },
          {
            title: "Faster key for long strings: character counts instead of sorting",
            detail:
              "Sorting each string costs O(k log k). A 26-length count array (or a string built from it) as the key avoids the sort entirely, trading it for an O(k) counting pass — better when strings are long.",
          },
        ],
      },
      {
        heading: "Complexity",
        points: [
          {
            title: "O(n · k log k) time with the sorted-key approach",
            detail: "n = number of strings, k = average string length; O(n · k) with the character-count key variant. O(n · k) space either way.",
          },
        ],
      },
    ],
    closingTip:
      "Mentioning the character-count key as a follow-up optimization (without needing to be prompted) is a good signal — it shows you know sorting isn't the only way to build a canonical key.",
  },
];
