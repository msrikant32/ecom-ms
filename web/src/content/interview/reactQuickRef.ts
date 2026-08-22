export type ReactDifficulty = "Basic" | "Intermediate" | "Advanced";

export interface QuickRefQuestion {
  category: string;
  difficulty: ReactDifficulty;
  question: string;
  answer: string;
  code?: string;
  codeLanguage?: string;
}

/**
 * Source: user-supplied react_interview_prep.html reference deck, expanded here with
 * fuller explanations and code examples for the mechanics-heavy items. Rendered as a
 * searchable/filterable collapsible deck on the React topic page, grouped by category
 * in this array's order.
 */
export const reactQuickRef: QuickRefQuestion[] = [
  // ---------- Fundamentals ----------
  {
    category: "Fundamentals",
    difficulty: "Basic",
    question: "What is JSX and how does it work under the hood?",
    answer:
      "JSX is syntactic sugar that compiles to React.createElement() calls (or the newer automatic jsx()/jsxs() runtime introduced in React 17), producing plain JavaScript objects that describe the UI tree — not real DOM nodes. The browser never sees JSX at all; a build step (Babel, SWC, or Next's compiler) transforms it before the code ships.",
    code: `// what you write\nconst el = <h1 className="title">Hi {name}</h1>;\n\n// what it compiles to (classic runtime)\nconst el = React.createElement(\n  "h1",\n  { className: "title" },\n  "Hi ",\n  name\n);`,
    codeLanguage: "jsx",
  },
  {
    category: "Fundamentals",
    difficulty: "Basic",
    question: "What is the Virtual DOM and why does React use it?",
    answer:
      "It's an in-memory, lightweight copy of the real DOM made of plain JS objects. On every state change, React builds a new virtual tree and diffs it against the previous one (reconciliation), then applies only the minimal set of real DOM mutations needed — real DOM writes are far more expensive than object comparisons, so batching and minimizing them is the whole point.",
  },
  {
    category: "Fundamentals",
    difficulty: "Basic",
    question: "Difference between props and state?",
    answer:
      "Props are read-only data passed down from a parent to a child — the child never mutates its own props directly. State is local, mutable data owned and managed inside a single component, changed only via its own setState/useState setter, and a change to it re-renders that component (and its children).",
  },
  {
    category: "Fundamentals",
    difficulty: "Basic",
    question: "Why do list items need a stable key prop?",
    answer:
      "Keys let React's diffing algorithm match array items across renders by identity, so it can reorder, insert, or delete efficiently instead of tearing down and recreating DOM nodes (and losing their internal state, like focus or an uncontrolled input's value). Using the array index as a key breaks this the moment the order changes — React matches by position, not identity, so items can silently swap their state.",
    code: `// breaks when items are reordered or removed\nitems.map((item, i) => <Row key={i} {...item} />);\n\n// correct — a stable, unique identifier\nitems.map((item) => <Row key={item.id} {...item} />);`,
    codeLanguage: "jsx",
  },
  {
    category: "Fundamentals",
    difficulty: "Basic",
    question: "What are React Fragments and why use them?",
    answer:
      "Fragments (<React.Fragment> or the <> </> shorthand) let a component return multiple sibling elements without wrapping them in an extra DOM node. That matters because an unnecessary wrapper <div> can break CSS layouts (flex/grid children), and is invalid HTML in places like inside a <table> or <select> where only specific children are allowed.",
  },
  {
    category: "Fundamentals",
    difficulty: "Basic",
    question: "Controlled vs uncontrolled components?",
    answer:
      "A controlled component has its value fully driven by React state — you set value and update it via onChange, so React is the single source of truth and you can validate or transform input on every keystroke. An uncontrolled component keeps its value in the DOM itself; you read it on demand via a ref (e.g. on submit) instead of tracking every change, which is simpler for e.g. a one-shot file input or a form you don't need to react to live.",
    code: `// controlled\nfunction ControlledInput() {\n  const [value, setValue] = useState("");\n  return <input value={value} onChange={(e) => setValue(e.target.value)} />;\n}\n\n// uncontrolled\nfunction UncontrolledInput() {\n  const ref = useRef<HTMLInputElement>(null);\n  const handleSubmit = () => console.log(ref.current?.value);\n  return <input ref={ref} defaultValue="" />;\n}`,
    codeLanguage: "tsx",
  },
  {
    category: "Fundamentals",
    difficulty: "Intermediate",
    question: "What is reconciliation and the diffing algorithm's key assumptions?",
    answer:
      "Reconciliation is how React decides which real DOM mutations are needed to go from the previous element tree to the new one. Rather than a general O(n³) tree-diff, React uses two heuristics that make it O(n): elements of a different type at the same position produce entirely different subtrees (full unmount + remount, no attempt to preserve state), and elements of the same type are compared in place, with the key prop used to match items within a list across renders instead of relying on position.",
  },
  {
    category: "Fundamentals",
    difficulty: "Intermediate",
    question: "What is the difference between React elements and components?",
    answer:
      "An element is a plain, immutable JS object describing what should appear on screen — created by JSX or React.createElement(), cheap to create, and thrown away every render. A component is a function (or class) that returns elements; it's the reusable logic/template, while the element is just one snapshot of its output at a point in time.",
  },
  {
    category: "Fundamentals",
    difficulty: "Intermediate",
    question: "What is prop drilling and what are its downsides?",
    answer:
      "Prop drilling is passing a value through several layers of components purely so it can reach a deeply nested descendant, even though the intermediate components never use it themselves. It couples those middle components to data they don't care about, makes their prop signatures noisier, and makes refactors risky — renaming or restructuring a middle component means updating every layer of the chain.",
  },
  {
    category: "Fundamentals",
    difficulty: "Advanced",
    question: "Explain React Fiber and why it replaced the old stack reconciler.",
    answer:
      "Fiber is React's reimplementation of the reconciliation engine, introduced in React 16. The old stack reconciler walked the element tree recursively and synchronously — once started, a render couldn't be paused, so a large tree update could block the main thread and drop frames. Fiber represents each unit of work as a linked-list node it can pause, abort, reuse, or reprioritize between frames, which is the foundation concurrent features (time slicing, Suspense, interruptible rendering) are built on.",
  },
  {
    category: "Fundamentals",
    difficulty: "Advanced",
    question: "Why can't you call hooks conditionally, in terms of React's internal implementation?",
    answer:
      "React doesn't track hook state by name — it tracks it as a linked list attached to the component's fiber, indexed purely by call order within the render. useState reads 'slot 3', not 'the count variable'. If a hook call is skipped on some render (inside an if or after an early return), every hook call after it shifts by one slot, so React reads the wrong stored state into the wrong hook — corrupting hooks that have nothing to do with the condition.",
  },
  {
    category: "Fundamentals",
    difficulty: "Intermediate",
    question: "What is the difference between React.PureComponent and a regular Component?",
    answer:
      "PureComponent implements shouldComponentUpdate for you with a shallow comparison of props and state, skipping the re-render when nothing shallowly changed. A regular Component re-renders on every parent render or setState call, regardless of whether anything actually changed, unless you write shouldComponentUpdate yourself — PureComponent is the class-era equivalent of wrapping a function component in React.memo.",
  },

  // ---------- Hooks ----------
  {
    category: "Hooks",
    difficulty: "Basic",
    question: "What problem do hooks solve?",
    answer:
      "Hooks let function components use state and lifecycle features that were previously class-only, and — more importantly — let you extract and reuse stateful logic (a custom hook) across components without the wrapper-nesting of higher-order components or render props, and without the recurring 'this' binding confusion classes bring.",
  },
  {
    category: "Hooks",
    difficulty: "Basic",
    question: "How does useState work and why can updates seem asynchronous?",
    answer:
      "useState returns the current value and a setter; calling the setter schedules a re-render with the new value rather than mutating anything immediately. React batches multiple setState calls that happen inside the same event handler into a single re-render for performance, so reading the state variable right after calling its setter — in the same handler — still shows the old value; the update is only visible on the next render.",
    code: `function Counter() {\n  const [count, setCount] = useState(0);\n  const handleClick = () => {\n    setCount(count + 1);\n    console.log(count); // still logs the OLD value — this render's closure\n  };\n  return <button onClick={handleClick}>{count}</button>;\n}`,
    codeLanguage: "tsx",
  },
  {
    category: "Hooks",
    difficulty: "Basic",
    question: "What does useEffect do and when does it run?",
    answer:
      "useEffect runs a side-effect function after the browser has painted the updated DOM — it's for anything that reaches outside React's render (fetching, subscriptions, timers, manual DOM work). It re-runs whenever any value in its dependency array changes since the last run, and the function it returns is a cleanup, called before the next run and on unmount.",
    code: `useEffect(() => {\n  const id = setInterval(() => setTick((t) => t + 1), 1000);\n  return () => clearInterval(id); // cleanup — runs before next effect + on unmount\n}, []); // empty deps = run once, after first paint`,
    codeLanguage: "tsx",
  },
  {
    category: "Hooks",
    difficulty: "Basic",
    question: "What is useContext and how do you use it?",
    answer:
      "useContext(MyContext) reads the current value provided by the nearest matching <MyContext.Provider> above it in the tree, letting a deeply nested component consume shared data directly instead of having it passed down through every intermediate layer's props.",
    code: `const ThemeContext = createContext<"light" | "dark">("light");\n\nfunction Toolbar() {\n  const theme = useContext(ThemeContext); // reads nearest Provider's value\n  return <div className={theme}>...</div>;\n}`,
    codeLanguage: "tsx",
  },
  {
    category: "Hooks",
    difficulty: "Intermediate",
    question: "Difference between useEffect and useLayoutEffect?",
    answer:
      "useEffect runs asynchronously, after the browser has painted — the user may see a frame before it runs. useLayoutEffect runs synchronously, after DOM mutations but before the browser paints, blocking the paint until it finishes. Reach for useLayoutEffect only when you must measure or mutate the DOM before the user sees anything, e.g. reading an element's size to position a tooltip — otherwise you get a visible flicker.",
  },
  {
    category: "Hooks",
    difficulty: "Intermediate",
    question: "What are the Rules of Hooks and why do they exist?",
    answer:
      "Hooks must be called at the top level of a component (never inside loops, conditionals, or nested functions) and only from React function components or other hooks. This exists because React tracks each hook by its call order per render, not by name — a hook called conditionally would shift every subsequent hook's position in that internal list, silently corrupting unrelated state.",
  },
  {
    category: "Hooks",
    difficulty: "Intermediate",
    question: "When would you write a custom hook?",
    answer:
      "When the same stateful logic — data fetching, a subscription, debouncing, form field handling — shows up in more than one component. A custom hook is just a function starting with 'use' that calls other hooks internally, extracting that logic into something reusable and independently testable, e.g. useFetch, useDebounce, useLocalStorage.",
    code: `function useLocalStorage<T>(key: string, initial: T) {\n  const [value, setValue] = useState<T>(() => {\n    const stored = localStorage.getItem(key);\n    return stored ? JSON.parse(stored) : initial;\n  });\n  useEffect(() => {\n    localStorage.setItem(key, JSON.stringify(value));\n  }, [key, value]);\n  return [value, setValue] as const;\n}`,
    codeLanguage: "tsx",
  },
  {
    category: "Hooks",
    difficulty: "Intermediate",
    question: "How do you fetch data on mount and avoid a race condition when props change quickly?",
    answer:
      "Fetch inside useEffect with the changing prop as a dependency, and guard against a stale response overwriting a newer one — either a boolean cleanup flag checked before calling setState, or an AbortController whose cleanup cancels the in-flight request when the effect re-runs before the previous fetch resolved.",
    code: `useEffect(() => {\n  const controller = new AbortController();\n  fetch(\`/api/users/\${userId}\`, { signal: controller.signal })\n    .then((res) => res.json())\n    .then(setUser)\n    .catch((err) => { if (err.name !== "AbortError") throw err; });\n  return () => controller.abort(); // cancels stale request if userId changes again\n}, [userId]);`,
    codeLanguage: "tsx",
  },
  {
    category: "Hooks",
    difficulty: "Advanced",
    question: "useMemo vs useCallback: what's the actual difference?",
    answer:
      "useMemo memoizes a computed value; useCallback memoizes a function reference. useCallback(fn, deps) is exactly equivalent to useMemo(() => fn, deps) — there is no behavioral difference beyond what's being cached. Both exist for the same reason: avoiding expensive recomputation, or keeping a reference stable so a child wrapped in React.memo doesn't see a 'new' prop every render and re-render unnecessarily.",
    code: `const filtered = useMemo(\n  () => items.filter((i) => i.category === category),\n  [items, category]\n); // recomputes only when items or category change\n\nconst handleClick = useCallback(\n  () => onSelect(id),\n  [onSelect, id]\n); // same function reference across renders unless deps change`,
    codeLanguage: "tsx",
  },
  {
    category: "Hooks",
    difficulty: "Advanced",
    question: "How does useRef differ from useState, and what is it used for?",
    answer:
      "useRef returns a mutable object whose .current property persists across renders, but changing it does NOT trigger a re-render — unlike useState, which always schedules one. It's used for direct DOM node references (ref={inputRef}), or storing any mutable value that should survive re-renders without being part of the rendered output, like a timer ID or the previous value of a prop.",
    code: `function Stopwatch() {\n  const startedAt = useRef<number | null>(null); // survives renders, never causes one\n  const start = () => { startedAt.current = Date.now(); };\n  return <button onClick={start}>Start</button>;\n}`,
    codeLanguage: "tsx",
  },
  {
    category: "Hooks",
    difficulty: "Advanced",
    question: "Explain useReducer and when you'd prefer it over useState.",
    answer:
      "useReducer manages state through a pure reducer function (state, action) => newState, dispatched via an action object — the same shape as Redux, just local to the component. Prefer it over useState when state logic is complex, has multiple related sub-values that change together, or the next state depends non-trivially on the previous one, since centralizing the transition logic in one function makes it easier to read, test, and keep consistent.",
    code: `type Action = { type: "increment" } | { type: "reset" };\nfunction reducer(state: number, action: Action) {\n  switch (action.type) {\n    case "increment": return state + 1;\n    case "reset": return 0;\n  }\n}\nconst [count, dispatch] = useReducer(reducer, 0);\ndispatch({ type: "increment" });`,
    codeLanguage: "tsx",
  },
  {
    category: "Hooks",
    difficulty: "Advanced",
    question: "Walk through a subtle useEffect dependency bug and how to fix it.",
    answer:
      "A common bug: an effect reads a function or object from the enclosing scope but omits it from the dependency array. The effect's closure captures the value from the render it was created in, so if that value changes on a later render, the effect keeps using the stale one — a 'stale closure'. Fixes: add the missing dependency (and wrap it in useCallback/useMemo upstream if that causes the effect to fire too often), or move the logic that needs the fresh value inside the effect itself so it isn't captured from outside at all.",
    code: `// bug — effect closes over the FIRST render's onUpdate\nuseEffect(() => {\n  socket.on("message", onUpdate); // stale after onUpdate prop changes\n  return () => socket.off("message", onUpdate);\n}, []); // missing dependency\n\n// fixed\nuseEffect(() => {\n  socket.on("message", onUpdate);\n  return () => socket.off("message", onUpdate);\n}, [onUpdate]);`,
    codeLanguage: "tsx",
  },
  {
    category: "Hooks",
    difficulty: "Advanced",
    question: "What is the useImperativeHandle hook for, and why is it rarely needed?",
    answer:
      "It customizes the value a parent receives when it attaches a ref to a child wrapped in forwardRef — instead of exposing the raw DOM node, the child can expose a curated set of imperative methods (e.g. focus(), scrollIntoView()). It's rarely needed because the large majority of parent-child communication should flow through props and state, not imperative method calls; reach for it only for genuinely imperative APIs like focus management or triggering an animation.",
  },

  // ---------- Performance ----------
  {
    category: "Performance",
    difficulty: "Basic",
    question: "Why does a component re-render, and how do you prevent unnecessary ones?",
    answer:
      "A component re-renders when its own state changes, its parent re-renders (by default, regardless of whether the props it passes actually changed), or a context value it consumes changes. To prevent unnecessary ones: wrap the component in React.memo, keep the props you pass referentially stable with useMemo/useCallback so memo's shallow comparison actually succeeds, and push state as far down the tree as possible so its changes don't force unrelated siblings to re-render.",
  },
  {
    category: "Performance",
    difficulty: "Intermediate",
    question: "What does React.memo do and when does it not help?",
    answer:
      "React.memo wraps a component and shallow-compares its new props against the previous ones, skipping the re-render if nothing changed. It doesn't help when you pass a new object, array, or inline function literal as a prop on every render — those are a different reference every time even if their contents are identical, which fails the shallow comparison — unless the parent memoizes them too with useMemo/useCallback.",
  },
  {
    category: "Performance",
    difficulty: "Intermediate",
    question: "How does code splitting with React.lazy and Suspense work?",
    answer:
      "React.lazy(() => import('./Component')) wraps a dynamic import so the component's code is fetched only when it's first rendered, splitting it into its own bundle chunk instead of the main bundle. A <Suspense fallback={...}> boundary above it shows the fallback UI while that chunk loads, then swaps in the real component once it resolves — shrinking the initial bundle for routes or features not everyone visits.",
    code: `const SettingsPanel = lazy(() => import("./SettingsPanel"));\n\nfunction App() {\n  return (\n    <Suspense fallback={<Spinner />}>\n      <SettingsPanel />\n    </Suspense>\n  );\n}`,
    codeLanguage: "tsx",
  },
  {
    category: "Performance",
    difficulty: "Intermediate",
    question: "What is the difference between shallow and deep comparison, and where does React use each?",
    answer:
      "Shallow comparison checks only top-level reference equality of an object's properties — it's what React.memo and PureComponent use by default. Deep comparison recursively checks nested values for equality; React deliberately doesn't do this anywhere by default, since walking an arbitrarily nested structure on every render would itself be expensive, so a prop change buried inside a nested object needs explicit handling (memoizing the nested value itself, or a custom comparison function passed to memo).",
  },
  {
    category: "Performance",
    difficulty: "Advanced",
    question: "How would you virtualize a list of 10,000 rows?",
    answer:
      "Use a windowing library like react-window or react-virtualized (or the browser-native content-visibility CSS property for simpler cases) that renders only the rows currently visible in the viewport plus a small overscan buffer, recycling DOM nodes as the user scrolls rather than mounting all 10,000 at once — the DOM node count stays roughly constant regardless of list size, which is what actually keeps scroll performance smooth.",
  },
  {
    category: "Performance",
    difficulty: "Advanced",
    question: "What causes a memoized component to still re-render unexpectedly, and how do you debug it?",
    answer:
      "Almost always a new object, array, or inline arrow function being created as a prop on every parent render, breaking React.memo's shallow reference comparison even though the 'content' looks unchanged. Debug it with the React DevTools Profiler — it can highlight 'why did this render' per commit — or add lightweight logging that compares each prop's reference across renders to pinpoint exactly which one changed identity.",
  },
  {
    category: "Performance",
    difficulty: "Advanced",
    question: "What is the difference between React.memo and useMemo, and can you combine them?",
    answer:
      "React.memo memoizes an entire component's rendered output based on a shallow comparison of its props. useMemo memoizes a single computed value inside a component's body. They're commonly combined: wrap the child component in React.memo, then use useMemo/useCallback in the parent to keep the specific props it receives referentially stable across renders — memo alone does nothing if the parent keeps handing it new object/function references.",
  },

  // ---------- State Management ----------
  {
    category: "State Management",
    difficulty: "Basic",
    question: "When should you lift state up versus keep it local?",
    answer:
      "Lift state up to the nearest common ancestor when two or more sibling components need to read or stay in sync with the same data. Keep it local when only one component (and its descendants) needs it — pushing state up unnecessarily widens its blast radius, causing more of the tree to re-render on every change.",
  },
  {
    category: "State Management",
    difficulty: "Basic",
    question: "What is derived state and why should you avoid storing it separately?",
    answer:
      "Derived state is anything computable from existing props or state — a filtered list from a full list plus a search term, a total from a list of line items. Storing it in its own state variable risks it silently going out of sync with the source data whenever you forget to update it in lockstep; instead compute it inline during render, or wrap the computation in useMemo if it's expensive.",
  },
  {
    category: "State Management",
    difficulty: "Intermediate",
    question: "What problem does the Context API solve, and what's its main downside?",
    answer:
      "Context lets deeply nested components read shared data directly from the nearest Provider, avoiding prop drilling through every intermediate layer. Its main downside: every component that consumes a context re-renders whenever that Provider's value changes, even if the consumer only reads one field of a larger value object — there's no built-in selector mechanism to subscribe to just a slice.",
  },
  {
    category: "State Management",
    difficulty: "Intermediate",
    question: "Context API vs Redux vs Zustand: how do you choose?",
    answer:
      "Context suits simple, infrequently-changing global data — theme, current user, locale — where the re-render-everything downside rarely matters. Redux fits large apps that need strict, predictable state transitions, middleware (logging, sagas), and time-travel debugging, at the cost of real boilerplate. Zustand sits between the two: a small store with selector-based subscriptions like Redux, but far less ceremony to set up — a good default when you outgrow Context but don't need Redux's full machinery.",
  },
  {
    category: "State Management",
    difficulty: "Advanced",
    question: "How would you architect state to avoid prop drilling and unnecessary re-renders in a large app?",
    answer:
      "Split state into several small, purpose-specific contexts or stores instead of one giant global one, so a change to one slice doesn't re-render consumers of unrelated slices. Colocate state as close as possible to where it's actually used rather than defaulting everything to global. And prefer selector-based state libraries (Zustand, Redux with reselect/RTK) over plain Context for anything that changes often, since selectors let a component subscribe to only the exact slice it reads.",
  },
  {
    category: "State Management",
    difficulty: "Advanced",
    question: "How does the Context API's re-render behavior differ from a selector-based store like Zustand?",
    answer:
      "Every consumer of a given Context re-renders whenever the Provider's value reference changes, full stop — there's no way to opt into 'only re-render if the part I read changed'. Zustand and similar stores let each component call a selector (e.g. useStore(s => s.user.name)) and only re-render when that specific selected value changes, comparing by value rather than forcing every consumer to react to every update.",
  },

  // ---------- Advanced Patterns ----------
  {
    category: "Advanced Patterns",
    difficulty: "Intermediate",
    question: "What is a Higher-Order Component and give an example use case?",
    answer:
      "An HOC is a function that takes a component and returns a new, enhanced component — e.g. withAuth(Component) that checks auth state and injects it as a prop, or redirects if the user isn't logged in. It's a composition pattern for reusing cross-cutting logic across many components; hooks have replaced most of its use cases, but HOCs still appear in some libraries (React Router's older APIs, some UI libraries) and for wrapping class components.",
    code: `function withAuth<P extends object>(Component: React.ComponentType<P>) {\n  return function AuthedComponent(props: P) {\n    const user = useAuth();\n    if (!user) return <Navigate to="/login" />;\n    return <Component {...props} />;\n  };\n}\nconst ProtectedDashboard = withAuth(Dashboard);`,
    codeLanguage: "tsx",
  },
  {
    category: "Advanced Patterns",
    difficulty: "Intermediate",
    question: "What are Render Props, and how do hooks compare?",
    answer:
      "A render prop is a function passed as a prop that a component calls, handing back its internal state so the caller controls what to render with it — <MouseTracker render={({x, y}) => <p>{x},{y}</p>} />. Hooks generally replace this pattern more cleanly since a custom hook (useMouseTracker()) hands back the same data without an extra layer of component nesting — the 'wrapper hell' render props and HOCs both tend to create when stacked.",
  },
  {
    category: "Advanced Patterns",
    difficulty: "Intermediate",
    question: "What is the children prop and how is composition used to avoid prop drilling?",
    answer:
      "children is the special prop containing whatever was nested between a component's opening and closing JSX tags. Passing components as children — composition — lets a parent render arbitrary, caller-provided content without needing to know its shape in advance, e.g. <Layout><Sidebar /><Main /></Layout>, avoiding the need to drill unrelated data through Layout just so Sidebar or Main can use it.",
  },
  {
    category: "Advanced Patterns",
    difficulty: "Advanced",
    question: "Explain the Compound Components pattern.",
    answer:
      "Compound components — like <Select> and <Select.Option> — share implicit state through context between a parent and its nested children, rather than the parent needing explicit props for every possible child configuration. This gives consumers a flexible, declarative API that mirrors native HTML elements like <select>/<option>, where the children compose freely instead of being passed as a rigid data prop.",
    code: `const SelectContext = createContext<{ value: string; onSelect: (v: string) => void } | null>(null);\n\nfunction Select({ value, onSelect, children }: SelectProps) {\n  return (\n    <SelectContext.Provider value={{ value, onSelect }}>{children}</SelectContext.Provider>\n  );\n}\nSelect.Option = function Option({ value, children }: OptionProps) {\n  const ctx = useContext(SelectContext)!;\n  return (\n    <div onClick={() => ctx.onSelect(value)} data-active={ctx.value === value}>\n      {children}\n    </div>\n  );\n};\n// usage: <Select value={v} onSelect={setV}><Select.Option value="a">A</Select.Option></Select>`,
    codeLanguage: "tsx",
  },
  {
    category: "Advanced Patterns",
    difficulty: "Advanced",
    question: "What are Error Boundaries and their limitations?",
    answer:
      "Error Boundaries are class components implementing componentDidCatch and/or static getDerivedStateFromError, which catch render-time errors thrown anywhere in their child tree and render a fallback UI instead of crashing the whole app. They cannot catch errors in event handlers (those need a plain try/catch), errors in async code (promises, setTimeout), server-side rendering errors, or errors thrown in the boundary itself — and there is still no hook equivalent, so this is one of the few places a class component remains necessary.",
  },
  {
    category: "Advanced Patterns",
    difficulty: "Advanced",
    question: "What are Portals used for?",
    answer:
      "createPortal(children, domNode) renders children into a DOM node outside the parent component's own DOM hierarchy, while still preserving React's event bubbling and context as if it were rendered in place. It's the standard way to build modals, tooltips, and dropdowns that need to visually escape a parent's overflow:hidden or a stacking context created by z-index/transform, without losing React's normal event and context behavior.",
    code: `function Modal({ children }: { children: React.ReactNode }) {\n  return createPortal(\n    <div className="modal-overlay">{children}</div>,\n    document.getElementById("modal-root")!\n  );\n}`,
    codeLanguage: "tsx",
  },
  {
    category: "Advanced Patterns",
    difficulty: "Advanced",
    question: "How would you implement a generic useDebounce or useThrottle custom hook?",
    answer:
      "For debounce: store the debounced value in its own state, and inside a useEffect keyed on the raw input value, start a setTimeout that updates the debounced state after the delay — the cleanup function clears that timeout on every keystroke, so only the timeout from the last change in the burst actually fires and commits.",
    code: `function useDebounce<T>(value: T, delayMs: number): T {\n  const [debounced, setDebounced] = useState(value);\n  useEffect(() => {\n    const id = setTimeout(() => setDebounced(value), delayMs);\n    return () => clearTimeout(id); // cancels the previous pending update\n  }, [value, delayMs]);\n  return debounced;\n}`,
    codeLanguage: "tsx",
  },

  // ---------- React 18/19 ----------
  {
    category: "React 18/19",
    difficulty: "Intermediate",
    question: "What is automatic batching in React 18?",
    answer:
      "React 18 batches all state updates into a single re-render regardless of where they happen — inside promises, setTimeout, native event handlers, or anywhere else — not just inside React's own synthetic event handlers, which was the React 17 limit. Fewer render passes for the same logical update means better performance for code that fires multiple setState calls outside a React event handler.",
    code: `// React 17: two renders (setTimeout is outside React's batching)\n// React 18: one render — batched automatically everywhere\nsetTimeout(() => {\n  setCount((c) => c + 1);\n  setFlag((f) => !f);\n}, 1000);`,
    codeLanguage: "tsx",
  },
  {
    category: "React 18/19",
    difficulty: "Intermediate",
    question: "What is hydration and what can go wrong with it?",
    answer:
      "Hydration is React attaching event listeners and internal fiber state to already-rendered, server-generated static HTML on the client, instead of tearing it down and re-building the DOM from scratch. If the client's first render produces different output than what the server sent — commonly from using Date.now(), Math.random(), or reading window/localStorage during render — React detects the mismatch, logs a hydration warning, and falls back to discarding and re-rendering the mismatched part on the client, which can cause a visible flash.",
  },
  {
    category: "React 18/19",
    difficulty: "Advanced",
    question: "Explain Concurrent Rendering and what problem it solves.",
    answer:
      "Concurrent rendering lets React prepare a new version of the UI in the background — interruptibly — while keeping the previous version visible and responsive. If a higher-priority update comes in mid-render (e.g. the user types while a big list is re-rendering), React can pause the low-priority work, handle the urgent update first, then resume or discard the interrupted render. This solves the classic problem of one long synchronous render blocking the main thread and making input feel laggy.",
  },
  {
    category: "React 18/19",
    difficulty: "Advanced",
    question: "useTransition vs useDeferredValue: when would you use each?",
    answer:
      "useTransition marks a state update you are triggering as low priority — you call startTransition around the setState call itself, typically for something like switching a filter or a tab. useDeferredValue instead defers a value you received (often as a prop) and don't control the update for, letting the UI keep showing the stale version of a computation while a fresh one renders in the background, then swapping in once ready.",
    code: `// useTransition — you control the update\nconst [isPending, startTransition] = useTransition();\nstartTransition(() => setTab(nextTab));\n\n// useDeferredValue — you only control what you render with a value you're given\nconst deferredQuery = useDeferredValue(query);\nconst results = useMemo(() => search(deferredQuery), [deferredQuery]);`,
    codeLanguage: "tsx",
  },
  {
    category: "React 18/19",
    difficulty: "Advanced",
    question: "What are React Server Components and how do they differ from SSR?",
    answer:
      "Server Components render entirely on the server and never ship any of their own JavaScript to the client — no hydration, no client bundle for that component — and can access backend resources (a database, the filesystem) directly without an API layer. Traditional SSR renders the same component tree on both the server (for the initial HTML) and the client (to hydrate and take over interactivity); Server Components are a genuinely different render target that produces zero client-side code for that piece of the tree, which is what Next's App Router builds on by default.",
  },

  // ---------- Testing ----------
  {
    category: "Testing",
    difficulty: "Basic",
    question: "What does React Testing Library encourage you to test?",
    answer:
      "It encourages testing components the way a real user would interact with them — querying by visible text, ARIA roles, and labels — rather than reaching into internal implementation details like state variables, instance methods, or component internals. The guiding idea is: the more your tests resemble how the software is actually used, the more confidence they give you.",
  },
  {
    category: "Testing",
    difficulty: "Intermediate",
    question: "How do you test a component that fetches data asynchronously?",
    answer:
      "Mock the fetch or axios call so the test is deterministic and doesn't hit a real network, render the component, then use Testing Library's findBy* queries (which retry until found or timeout) or waitFor to assert on the UI once the promise resolves and the DOM updates — avoiding brittle, flaky fixed-duration setTimeout waits.",
  },
  {
    category: "Testing",
    difficulty: "Intermediate",
    question: "What's the difference between shallow rendering and full DOM rendering in tests?",
    answer:
      "Shallow rendering (Enzyme's older default) renders a component only one level deep, stubbing out its children entirely — useful for strictly isolated unit tests of one component's own logic. Full DOM rendering, which is React Testing Library's default, mounts the entire subtree for real, better reflecting what a user actually sees and catching integration issues between parent and child that shallow rendering would miss.",
  },
  {
    category: "Testing",
    difficulty: "Advanced",
    question: "How would you test a custom hook in isolation?",
    answer:
      "Use renderHook from React Testing Library to mount the hook without needing a full host component, then wrap any state-updating calls in act() so React flushes the resulting re-render before you assert, and read the current value off the returned result.current — simulating exactly how a consuming component would use the hook.",
    code: `const { result } = renderHook(() => useCounter());\nact(() => result.current.increment());\nexpect(result.current.count).toBe(1);`,
    codeLanguage: "tsx",
  },
  {
    category: "Testing",
    difficulty: "Advanced",
    question: "How do you avoid brittle snapshot tests in a React codebase?",
    answer:
      "Keep snapshots small and scoped to stable, meaningful output — a single component's rendered markup, not an entire page — since large snapshots tend to break on unrelated changes elsewhere in the tree and quickly lose their signal. Prefer explicit assertions on visible text/roles for anything behavior-critical, and treat a snapshot diff as something to actually read and judge, not something to reflexively re-approve with --updateSnapshot.",
  },

  // ---------- Forms & Events ----------
  {
    category: "Forms & Events",
    difficulty: "Basic",
    question: "What is a SyntheticEvent in React?",
    answer:
      "It's React's cross-browser wrapper around the native DOM event, normalizing property names and behavior so onClick/onChange/etc. work consistently regardless of browser quirks. Earlier React versions pooled and reused SyntheticEvent objects for performance (meaning you couldn't safely read event properties asynchronously without calling event.persist()); React 17 removed pooling, so synthetic events now behave like plain objects you can hold onto.",
  },
  {
    category: "Forms & Events",
    difficulty: "Intermediate",
    question: "How would you build a reusable, accessible form input with validation?",
    answer:
      "Bind value and onChange to state so it's a controlled input, associate its <label> to the input via htmlFor/id so screen readers announce it correctly, surface validation errors through aria-invalid and aria-describedby pointing at the error message's id, and extract the actual validation rules into a reusable hook so multiple fields across the app share consistent logic instead of duplicating it per form.",
  },

  // ---------- Routing ----------
  {
    category: "Routing",
    difficulty: "Intermediate",
    question: "Browser routing vs hash routing vs memory routing — what's the difference, and how do you choose?",
    answer:
      "Browser (history/push-state) routing uses the HTML5 History API — pushState/replaceState — to change the URL without a full page reload, giving clean paths like /dashboard/settings. It needs a server (or CDN/static host) configured to fall back to index.html for every path, because a hard refresh or direct link to /dashboard/settings is a real request the server has to answer, and only your client-side router knows what that path means. Hash routing keeps the route in the URL fragment after '#' — the browser never sends anything after '#' to the server, so no rewrite/fallback config is needed at all; it works even off a plain static file server or a local file:// URL, at the cost of uglier URLs (/#/dashboard/settings) and a fragment that can no longer be used for real in-page anchor scrolling. Memory routing keeps the current location entirely in an in-memory array, never touching the browser's actual address bar or history — used where there is no real address bar to sync with: React Native, unit/integration tests, or a router embedded inside a widget that shouldn't hijack the host page's URL. Default to browser routing for a normal deployed web app (cleanest URLs, what users expect); reach for hash routing only when you can't control server rewrite rules (e.g. a static file share with no fallback support); use memory routing for React Native or tests.",
    code: `import { BrowserRouter, HashRouter, MemoryRouter, Routes, Route } from "react-router-dom";\n\n// deployed web app — clean URLs, needs server fallback to index.html for unknown paths\n<BrowserRouter>\n  <Routes>\n    <Route path="/dashboard/:id" element={<Dashboard />} />\n  </Routes>\n</BrowserRouter>\n\n// static host with no rewrite rules — URL becomes example.com/#/dashboard/42\n<HashRouter>\n  <Routes><Route path="/dashboard/:id" element={<Dashboard />} /></Routes>\n</HashRouter>\n\n// no real address bar (tests, React Native, an embedded widget)\n<MemoryRouter initialEntries={["/dashboard/42"]}>\n  <Routes><Route path="/dashboard/:id" element={<Dashboard />} /></Routes>\n</MemoryRouter>`,
    codeLanguage: "tsx",
  },
  {
    category: "Routing",
    difficulty: "Advanced",
    question: "How does file-system-based routing (e.g. Next.js App Router) differ from a runtime router like react-router?",
    answer:
      "react-router (browser/hash/memory, as above) defines routes at runtime as a JS data structure — a tree of <Route> elements or a routes config object — matched against the current location by code running in the browser. File-system routing instead derives routes from the folder structure itself at build time: a file at app/dashboard/[id]/page.tsx becomes the route /dashboard/:id with no separate route config to keep in sync with the file layout. That build-time knowledge is what lets a framework like Next.js do per-route code splitting and static generation automatically, and — critically for Server Components — decide what can render on the server versus what needs to ship to the client, none of which a purely client-side runtime router can do since it only ever sees routes after the whole app has already loaded in the browser. This app's own /interview/topics/[topic] and /rendering/[mode]-style routes are exactly this pattern.",
  },

  // ---------- System Design ----------
  {
    category: "System Design",
    difficulty: "Intermediate",
    question: "How do you decide what should be a separate component versus inline JSX?",
    answer:
      "Extract into its own component when that JSX is reused elsewhere, has distinct state or logic of its own, or the surrounding component has grown hard to read as one block — generally following single-responsibility so each component does one clearly nameable thing. Inline JSX is fine for markup that's genuinely one-off and small enough to read at a glance.",
  },
  {
    category: "System Design",
    difficulty: "Intermediate",
    question: "How would you share business logic between a React web app and a React Native app?",
    answer:
      "Extract everything platform-agnostic — data fetching, validation rules, state management, custom hooks — into a shared package that has no DOM or native-specific imports (no document, no react-dom, no native modules). Keep only the actual visual components platform-specific (web JSX vs. React Native's View/Text), importing the same shared hooks and logic into both.",
  },
  {
    category: "System Design",
    difficulty: "Advanced",
    question: "How would you structure a large React app's folder architecture?",
    answer:
      "Favor feature-based folders (group by domain: /features/orders, /features/users, each owning its own components, hooks, and state) over type-based folders (/components, /hooks, /reducers spread flat across the whole app). Feature folders scale better because related code stays colocated as the app grows — you can usually delete or move a whole feature without hunting across a dozen type-based directories.",
  },
  {
    category: "System Design",
    difficulty: "Advanced",
    question: "How would you design a micro-frontend architecture with React?",
    answer:
      "Split the app into independently deployable pieces, each owned by a different team, composed together at runtime via module federation (or, more crudely, iframes) rather than all being built and deployed as one monolith. Share a common design system so the pieces feel consistent, communicate across them through a thin event bus or shared context rather than tight coupling, and keep each micro-frontend's own React version and internal state isolated so one team's release can't break another's.",
  },
  {
    category: "System Design",
    difficulty: "Advanced",
    question: "How do you handle a component tree with deeply nested prop drilling in a legacy codebase?",
    answer:
      "First identify exactly which piece of data is crossing the many layers, then move it into a scoped context (or a state management library) introduced at the nearest common ancestor that actually needs it — not necessarily the app root. Refactor incrementally, one branch of the tree at a time, and use composition (passing already-built children as props) to shorten the chain further wherever a full context provider would be overkill.",
  },
  {
    category: "System Design",
    difficulty: "Advanced",
    question: "How would you approach migrating a class component codebase to hooks?",
    answer:
      "Migrate incrementally, component by component, starting with leaf components that have little or no lifecycle complexity so early wins are low-risk. Replace componentDidMount/componentDidUpdate/componentWillUnmount with the appropriate useEffect (and its cleanup function), convert this.state fields into one or more useState calls or a single useReducer for related state, and add tests before migrating each component so behavioral regressions get caught immediately rather than discovered later.",
  },
];

export const reactQuickRefCategories: string[] = [...new Set(reactQuickRef.map((q) => q.category))];
