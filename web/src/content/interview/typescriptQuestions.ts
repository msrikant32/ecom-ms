import type { InterviewQuestion } from "./types";

// TypeScript, basic through advanced/architecture level. This entire
// frontend (web/) is written in TypeScript, so most examples are grounded
// in real interfaces/types already living in this repo rather than
// generic textbook snippets.
export const typescriptQuestions: InterviewQuestion[] = [
  {
    slug: "typescript-what-it-actually-gives-you",
    question: "What does TypeScript actually give you that JavaScript doesn't — and what does it NOT give you?",
    category: "TypeScript",
    round: "general",
    summary:
      "Compile-time type checking that catches a real class of bugs before runtime, better editor tooling (autocomplete, refactoring safety), and self-documenting function signatures — but zero runtime safety, since types are fully erased on compile and don't exist anymore when the code actually runs.",
    intro: "The 'what it doesn't give you' half is the one people forget, and it's exactly what causes real production bugs when someone assumes a type annotation is a runtime guarantee.",
    sections: [
      {
        heading: "What it actually gives you",
        points: [
          {
            title: "Compile-time checking, tooling, and documentation",
            detail:
              "TypeScript catches an entire class of bugs (calling a function with the wrong argument shape, typo-ing a property name, forgetting a required field) at compile time instead of at runtime in production. Editor tooling built on top of the type system (autocomplete, jump-to-definition, safe rename-refactoring across an entire codebase) is arguably as valuable day-to-day as the error-catching itself. A typed function signature is also documentation that can't silently go stale the way a comment can.",
          },
        ],
      },
      {
        heading: "What it does NOT give you — this is the part people miss",
        points: [
          {
            title: "Types are fully erased at compile time — zero runtime enforcement",
            detail:
              "TypeScript compiles to plain JavaScript with every type annotation stripped out — at runtime, there is no type checking happening at all. Data crossing a real boundary (a JSON API response, user input, anything from outside the TypeScript-checked code) can be ANY shape at runtime regardless of what you typed it as, and TypeScript will not catch that mismatch — you have to validate it explicitly (a runtime schema validator, a type guard) at exactly the boundary where untyped data enters typed code.",
            code: `interface User { id: string; email: string; }

async function getUser(id: string): Promise<User> {
  const res = await fetch(\`/api/users/\${id}\`);
  return res.json(); // TypeScript TRUSTS this is a User — it has NO idea what the API actually returned
}
// if the API's shape changes, this compiles fine and fails (or silently misbehaves) at runtime`,
            codeLanguage: "typescript",
          },
        ],
      },
    ],
    closingTip: "State both halves explicitly, in that order: 'compile-time safety and tooling, not runtime safety — anything crossing a real I/O boundary still needs runtime validation, since TypeScript's types don't exist anymore once the code is actually running.'",
  },
  {
    slug: "typescript-any-vs-unknown",
    question: "any vs unknown — why is unknown considered the safer escape hatch?",
    category: "TypeScript",
    round: "general",
    summary:
      "any disables type checking entirely for that value — you can do anything with it, and TypeScript won't complain even if it's wrong. unknown also accepts anything, but forces you to narrow/check its type before you're allowed to do anything with it — the safety comes back the moment you actually need to use the value.",
    intro: "This is a frequently-asked, easy-to-get-superficially-right question — the strongest answer explains WHY unknown is safer with a concrete example of what any lets slip through.",
    sections: [
      {
        heading: "any — an opt-out from the type system",
        points: [
          {
            title: "Once something is any, TypeScript stops checking it entirely",
            detail:
              "A value typed as any can be assigned to anything, have any property accessed, be called as a function — with zero compile-time checking. It also POISONS anything it touches: assigning an any value to a typed variable makes further operations on that variable unchecked too, silently spreading the loss of safety through the codebase.",
            code: `let value: any = fetchSomething();
value.nonExistentMethod(); // compiles fine — crashes at runtime, TypeScript gave no warning at all`,
            codeLanguage: "typescript",
          },
        ],
      },
      {
        heading: "unknown — accepts anything, but makes you prove what it is before using it",
        points: [
          {
            title: "The safety comes back the moment you check the type",
            detail:
              "unknown can hold any value too, but TypeScript refuses to let you call a method, access a property, or otherwise operate on it until you've narrowed it to a specific type first (a typeof check, an instanceof check, a custom type guard). This forces exactly the runtime validation that any lets you skip silently.",
            code: `let value: unknown = fetchSomething();
value.nonExistentMethod(); // COMPILE ERROR — "Object is of type 'unknown'"

if (typeof value === "string") {
  value.toUpperCase(); // fine — TypeScript now knows it's a string, narrowed from unknown
}`,
            codeLanguage: "typescript",
          },
        ],
      },
    ],
    closingTip: "The rule to state directly: 'default to unknown for anything genuinely of unknown shape (an API response, JSON.parse output) — any should be a rare, deliberate exception, not a convenient default when a type is annoying to write correctly.'",
  },
  {
    slug: "typescript-interface-vs-type-alias",
    question: "interface vs type — when do you actually reach for one over the other?",
    category: "TypeScript",
    round: "general",
    summary:
      "Interfaces support declaration merging and are generally preferred for object shapes meant to be extended; type aliases can express things interfaces can't at all (unions, mapped types, conditional types) — for a plain object shape, either works, and consistency within a codebase matters more than the choice itself.",
    intro: "A common trap is treating this as a big philosophical divide — in practice, the real deciding factor is usually 'can a type alias express what I need' since interfaces are strictly more limited in what they can represent.",
    sections: [
      {
        heading: "What only type aliases can express",
        points: [
          {
            title: "Unions, primitives, tuples, mapped and conditional types",
            detail:
              "A union of possible shapes (type Result = Success | Failure), a union of string literals, a tuple type, a mapped type transforming another type's keys — none of these can be written as an interface at all. If you need any of these, the choice is made for you.",
            code: `type Direction = "prev" | "next"; // interfaces can't express a union of literals at all

interface RateLimitStep {
  algorithm: Direction; // fine — an interface can USE a type alias as a field's type
}`,
            codeLanguage: "typescript",
          },
        ],
      },
      {
        heading: "What only interfaces can do",
        points: [
          {
            title: "Declaration merging — multiple declarations of the same interface combine",
            detail:
              "Declaring the same interface name twice merges their members into one — used deliberately for augmenting third-party library types (extending Express's Request type with a custom req.user field, for instance). A type alias with the same name declared twice is a compile error, not a merge — this is the one capability genuinely unique to interfaces.",
          },
        ],
      },
      {
        heading: "For a plain object shape, either works — pick a convention and stay consistent",
        points: [
          {
            title: "This codebase's own convention",
            detail:
              "This app consistently uses interface for object shapes (PagerEntry, InterviewQuestion, RateLimitStep) and type only where a union or similarly interface-incompatible shape is actually needed — a reasonable, common convention, not the only correct one.",
            sourceRef: "web/src/components/layout/Pager.tsx (PagerEntry), web/src/content/interview/types.ts (InterviewQuestion)",
          },
        ],
      },
    ],
    closingTip: "Don't overstate the difference: 'for a plain object shape it barely matters — pick based on whether you need something only a type alias can express (unions), default to interface otherwise, and stay consistent within one codebase.'",
  },
  {
    slug: "typescript-generics-fundamentals",
    question: "Explain generics with a real example — what problem do they actually solve?",
    category: "TypeScript",
    round: "general",
    summary:
      "A generic lets a function or type stay reusable across different concrete types WITHOUT losing type information — the alternative (using any) would be reusable too, but you'd lose all type safety on the way through.",
    intro: "The strongest answers show the actual problem generics solve by contrasting against the any-typed version of the same function, not just defining the angle-bracket syntax.",
    sections: [
      {
        heading: "The problem without generics",
        points: [
          {
            title: "Reusable, but blind — any loses the connection between input and output types",
            detail:
              "A function written to accept any and return any is genuinely reusable across types, but TypeScript can no longer connect what you PUT IN to what you GET OUT — calling it with a string and getting back something typed any tells you nothing about what actually comes back.",
          },
        ],
      },
      {
        heading: "What a generic actually does — ties input and output types together",
        points: [
          {
            title: "A type parameter that gets filled in per call, preserving the connection",
            detail:
              "Reusable across any type, AND TypeScript tracks exactly which type was used for each specific call, applying that same type to the return value.",
            code: `// this app's own useStepController<T> — generic over ANY step shape
function useStepController<T>(steps: T[]): StepController<T> {
  // ...
  return { currentStep: steps[stepIndex] /* typed as T, not any */, /* ... */ };
}

// used with two completely different, unrelated step shapes elsewhere in this app:
useStepController<RateLimitStep>(fixedWindowSteps); // currentStep is RateLimitStep
useStepController<ShardingStep>(naiveShardingSteps); // currentStep is ShardingStep — same function, different type each time`,
            codeLanguage: "typescript",
            sourceRef: "web/src/components/visualizer/useStepController.ts — genuinely reused across the rate-limit and sharding animations with different step shapes",
          },
        ],
      },
    ],
    closingTip: "Frame it as the middle ground between 'one function per type' (no reuse) and 'any' (reuse, but blind): 'a generic function stays reusable across types while TypeScript still tracks exactly which type was used for each call' — this repo's own useStepController<T> is a real, running example of exactly that.",
  },
  {
    slug: "typescript-utility-types",
    question: "Explain Partial, Pick, Omit, and Record — what are TypeScript's built-in utility types actually for?",
    category: "TypeScript",
    round: "general",
    summary:
      "Utility types transform an EXISTING type into a new, related one without redeclaring it from scratch — Partial makes every field optional, Pick/Omit select or exclude specific fields, and Record builds an object type from a key type and a value type.",
    intro: "The strongest answers frame utility types around the problem they solve — deriving a related type without duplicating and manually keeping two type declarations in sync.",
    sections: [
      {
        heading: "Partial, Pick, Omit — deriving a variant of an existing type",
        points: [
          {
            title: "Without redeclaring every field by hand",
            detail:
              "Partial<T> makes every field of T optional — useful for an update/patch function where any subset of fields might be provided. Pick<T, 'a' | 'b'> creates a type with only the named fields. Omit<T, 'a'> creates a type with every field EXCEPT the named ones. All three derive a new type from an existing one, so a change to the original type automatically flows through — no risk of the derived type silently drifting out of sync with a hand-maintained duplicate.",
            code: `interface InterviewQuestion {
  slug: string;
  question: string;
  category: string;
  sections: AnswerSection[];
  closingTip: string;
}

// a "create" form might not need slug yet (generated after) — derive it, don't redeclare it
type DraftQuestion = Omit<InterviewQuestion, "slug">;

// a search/filter UI might only care about two fields
type QuestionSummary = Pick<InterviewQuestion, "slug" | "question">;`,
            codeLanguage: "typescript",
          },
        ],
      },
      {
        heading: "Record — an object type from a key type and a value type",
        points: [
          {
            title: "Exactly the shape of a lookup map",
            detail:
              "Record<K, V> is an object type where every key is of type K and every value is of type V — this app's own CATEGORY_TO_TOPIC mapping and TOPIC_ICON map are both real examples: a Record<string, string> and a Record<string, LucideIcon> respectively.",
            code: `const CATEGORY_TO_TOPIC: Record<string, string> = {
  JavaScript: "javascript",
  React: "react",
  // ...
};`,
            codeLanguage: "typescript",
            sourceRef: "web/src/content/interview/index.ts",
          },
        ],
      },
    ],
    closingTip: "Frame all of them around the same principle: 'derive a related type from an existing one instead of hand-duplicating fields — the derived type can never silently drift out of sync with the source type, since it's computed from it.'",
  },
  {
    slug: "typescript-discriminated-unions-exhaustiveness",
    question: "What is a discriminated union, and how does it enable exhaustiveness checking?",
    category: "TypeScript",
    round: "general",
    summary:
      "A discriminated union is a union of object types sharing one common, literal-typed field (the 'discriminant') that TypeScript can use to narrow which specific variant you're dealing with — and the compiler can then FORCE you to handle every variant, catching a missed case at compile time instead of at runtime.",
    intro: "The exhaustiveness-checking trick (the never-typed default case) is the detail that shows real, practical fluency with this pattern, not just knowing the definition.",
    sections: [
      {
        heading: "The pattern",
        points: [
          {
            title: "A shared, literal-typed field that TypeScript narrows on automatically",
            detail:
              "A union of object shapes, each with the same field name holding a distinct literal type (a 'kind' or 'type' field) — checking that field inside an if/switch automatically narrows TypeScript's understanding of which shape you're working with in that branch, with full type safety on the OTHER fields too.",
            code: `type Action =
  | { type: "increment" }
  | { type: "setValue"; value: number }; // note: only THIS variant has a 'value' field

function reducer(state: number, action: Action): number {
  switch (action.type) {
    case "increment": return state + 1;
    case "setValue": return action.value; // TypeScript KNOWS action.value exists here, only in this branch
  }
}`,
            codeLanguage: "typescript",
          },
        ],
      },
      {
        heading: "Exhaustiveness checking — the compiler catches a missed case",
        points: [
          {
            title: "Assign the unhandled remainder to a variable typed never",
            detail:
              "Adding a default branch that assigns the action to a variable explicitly typed never causes a COMPILE ERROR if a new union variant is ever added later and this switch wasn't updated to handle it — because in that scenario, the 'remaining' type in that branch is no longer never, it's the new unhandled variant. This turns 'someone added a new action type and forgot to handle it somewhere' from a runtime bug into a compile-time error.",
            code: `function reducer(state: number, action: Action): number {
  switch (action.type) {
    case "increment": return state + 1;
    case "setValue": return action.value;
    default:
      const _exhaustive: never = action; // compile error if a new Action variant isn't handled above
      throw new Error(\`Unhandled action: \${JSON.stringify(action)}\`);
  }
}`,
            codeLanguage: "typescript",
          },
        ],
      },
    ],
    closingTip: "Naming the never-typed exhaustiveness check unprompted is the single strongest signal in this question — it's the difference between knowing what a discriminated union is and knowing how to make the compiler actually enforce completeness as the codebase evolves.",
  },
  {
    slug: "typescript-type-narrowing-guards",
    question: "How does TypeScript narrow types, and what is a custom type guard?",
    category: "TypeScript",
    round: "general",
    summary:
      "Narrowing is TypeScript refining a broader type to a more specific one within a conditional branch, based on a runtime check it recognizes (typeof, instanceof, a truthiness check, an 'in' check) — a custom type guard is a function you write that TypeScript will trust for narrowing too, when the built-in checks aren't enough.",
    intro: "The strongest answers connect narrowing directly back to the any-vs-unknown question — narrowing is literally the mechanism that makes an unknown value usable safely.",
    sections: [
      {
        heading: "Built-in narrowing TypeScript recognizes automatically",
        points: [
          {
            title: "typeof, instanceof, truthiness, and the 'in' operator",
            detail:
              "typeof x === 'string' narrows a union to its string member inside that branch. x instanceof SomeClass narrows to that class. if (x) narrows out null/undefined. 'key' in obj narrows a union of object shapes to the ones that actually have that key. TypeScript recognizes all of these patterns specifically and narrows automatically — no special syntax needed beyond the check itself.",
          },
        ],
      },
      {
        heading: "Custom type guards — teaching TypeScript your own narrowing logic",
        points: [
          {
            title: "A function returning `value is SomeType` instead of just boolean",
            detail:
              "When the check is more complex than a built-in pattern can express, a function with a return type of `x is SomeType` (a type predicate) tells TypeScript to trust that narrowing wherever the function is called in a conditional — the function's actual runtime logic can be anything; TypeScript just trusts the type predicate you declared.",
            code: `interface Success { ok: true; data: unknown; }
interface Failure { ok: false; error: string; }

function isSuccess(result: Success | Failure): result is Success {
  return result.ok === true;
}

function handle(result: Success | Failure) {
  if (isSuccess(result)) {
    console.log(result.data); // narrowed to Success — TypeScript trusts the type predicate
  }
}`,
            codeLanguage: "typescript",
          },
        ],
      },
    ],
    closingTip: "Connect it explicitly to unknown: 'narrowing is the exact mechanism that makes unknown safe to use at all — you can't do anything with an unknown value until a narrowing check (built-in or a custom type guard) proves what it actually is.'",
  },
  {
    slug: "typescript-structural-typing",
    question: "TypeScript uses structural typing — what does that actually mean, and how does it differ from nominal typing?",
    category: "TypeScript",
    round: "general",
    summary:
      "Two types are compatible if they have the same SHAPE, regardless of name or explicit declaration — unlike a nominally-typed language (Java, C#) where compatibility depends on explicit inheritance/interface declaration, not just matching shape. This is sometimes called 'duck typing, but checked at compile time'.",
    intro: "A genuinely common surprise for engineers coming from a nominally-typed language — the strongest answers show a concrete example of two UNRELATED types being assignable purely because their shapes match.",
    sections: [
      {
        heading: "Shape determines compatibility, not declared relationship",
        points: [
          {
            title: "Two entirely unrelated interfaces are assignable if their shapes match",
            detail:
              "In a nominally-typed language, a Dog isn't assignable to a Duck-typed parameter unless it explicitly implements/extends something establishing that relationship. In TypeScript, if Dog happens to have every property Duck requires, it's assignable — TypeScript never checks that the two types have any DECLARED relationship, only that the shape is compatible.",
            code: `interface HasSlug { slug: string; }

function logSlug(item: HasSlug) { console.log(item.slug); }

// PagerEntry was never declared to implement HasSlug — but it has a slug field, so it's assignable
interface PagerEntry { href: string; label: string; slug?: string; }
const entry: PagerEntry = { href: "/x", label: "X", slug: "x" };
logSlug(entry); // fine — shape matches, no declared relationship needed at all`,
            codeLanguage: "typescript",
          },
        ],
      },
      {
        heading: "The practical consequence — extra properties are usually fine, missing ones aren't",
        points: [
          {
            title: "'At least this shape' is closer to the real rule than 'exactly this shape'",
            detail:
              "An object with MORE properties than a type requires is generally still assignable (it satisfies the required shape and then some) — an object MISSING a required property is not. This is why structural typing is often summarized as 'if it has everything required, that's enough,' though object LITERALS specifically get extra 'excess property checking' that catches typos a variable of the same shape would not.",
          },
        ],
      },
    ],
    closingTip: "The concrete example is what makes this answer land: 'two types with zero declared relationship are still assignable if their shapes match — TypeScript checks shape, not declared identity, which is the core difference from nominal typing in languages like Java.'",
  },
  {
    slug: "typescript-conditional-and-mapped-types",
    question: "Explain conditional types and mapped types, with a real example of each.",
    category: "TypeScript",
    round: "general",
    summary:
      "A mapped type transforms every key of an existing type the same way (e.g. making them all optional or readonly) — a conditional type picks between two types based on a type-level condition, evaluated at compile time, not runtime.",
    intro: "Advanced-tier — these are the mechanisms the built-in utility types (Partial, Pick, etc.) are actually implemented with, so understanding them means understanding what those utilities are really doing underneath.",
    sections: [
      {
        heading: "Mapped types — transform every key the same way",
        points: [
          {
            title: "Partial<T> is a mapped type, and you can write the same pattern yourself",
            detail:
              "A mapped type iterates over every key K of an existing type T and applies the same transformation to each — this is literally how Partial<T> is implemented in TypeScript's own standard library.",
            code: `// roughly how Partial<T> is actually implemented
type MyPartial<T> = { [K in keyof T]?: T[K] };

// applied to this app's own PagerEntry
type PartialPagerEntry = MyPartial<PagerEntry>; // { href?: string; label?: string; eyebrow?: string }`,
            codeLanguage: "typescript",
          },
        ],
      },
      {
        heading: "Conditional types — a type-level if/else",
        points: [
          {
            title: "T extends U ? X : Y — evaluated at compile time based on the type, not a runtime value",
            detail:
              "A conditional type picks between two resulting types depending on whether one type is assignable to another — this happens entirely at compile time, based on TYPES, and has nothing to do with any runtime condition. Commonly combined with infer to extract a piece of a type, like pulling a function's return type out.",
            code: `type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

type A = UnwrapPromise<Promise<string>>; // string
type B = UnwrapPromise<number>;          // number — not a Promise, condition is false, T itself is returned`,
            codeLanguage: "typescript",
          },
        ],
      },
    ],
    closingTip: "Connect this back to the utility-types question if it comes up together: 'Partial, Pick, and friends aren't special compiler magic — they're mapped (and sometimes conditional) types defined in TypeScript's own standard library, using exactly this mechanism.'",
  },
  {
    slug: "typescript-strict-mode-and-tsconfig",
    question: "What does TypeScript's strict mode actually turn on, and why does it matter?",
    category: "TypeScript",
    round: "general",
    summary:
      "strict is a bundle of several independent compiler flags (noImplicitAny, strictNullChecks, and others) — strictNullChecks specifically is the single highest-value one, since without it, null and undefined are silently assignable to almost everything, defeating a huge fraction of what type-checking is supposed to catch.",
    intro: "Naming strictNullChecks specifically, and why it matters more than the others, is the detail that shows real hands-on experience with strict mode rather than just knowing the flag exists.",
    sections: [
      {
        heading: "strict is a bundle, not one flag",
        points: [
          {
            title: "noImplicitAny, strictNullChecks, strictFunctionTypes, and several more",
            detail:
              "noImplicitAny errors on a value TypeScript can't infer a type for and would otherwise silently treat as any (closing exactly the escape hatch covered in the any-vs-unknown question). strictFunctionTypes checks function parameter types more soundly. Several other narrower flags round out the bundle — but strictNullChecks does the most real-world work of any single one.",
          },
        ],
      },
      {
        heading: "strictNullChecks — the highest-value flag in the bundle",
        points: [
          {
            title: "Without it, null/undefined are silently assignable to almost any type",
            detail:
              "With strictNullChecks OFF, a variable typed string can also, silently, be null or undefined — TypeScript won't warn you, and 'cannot read property of undefined' remains a live runtime risk despite having 'type safety'. With it ON, null/undefined have to be explicitly included in a type (string | null) to be assignable — forcing every genuinely nullable value to be handled explicitly, which closes off a huge, extremely common class of real production bugs.",
            code: `function greet(name: string) { return \`Hello, \${name}\`; }

// WITHOUT strictNullChecks: this compiles fine, crashes at runtime
greet(undefined as any); // (or even without 'as any' in some pre-strict setups)

// WITH strictNullChecks: greet(undefined) is a compile error — caught before it ships`,
            codeLanguage: "typescript",
          },
        ],
      },
    ],
    closingTip: "If asked which single flag matters most: strictNullChecks, without hesitation — it's the one that closes the gap between 'this compiles' and 'this won't throw a null-reference-style error at runtime,' which is most of what people actually want from TypeScript's safety in practice.",
  },
  {
    slug: "typescript-enums-vs-literal-unions",
    question: "Enums vs string literal unions in TypeScript — why do many teams prefer literal unions?",
    category: "TypeScript",
    round: "general",
    summary:
      "A TypeScript enum generates real runtime JavaScript code (an object) and has several sharp edges (numeric enums allow any number in, const enum has cross-module compilation caveats) — a string literal union is purely a compile-time construct with none of those issues, and this app uses literal unions exclusively.",
    intro: "This is a genuinely opinionated, frequently-debated area of TypeScript — the strongest answer names the SPECIFIC sharp edges of enums rather than just asserting 'unions are better' as received wisdom.",
    sections: [
      {
        heading: "What an enum actually is — not just a type",
        points: [
          {
            title: "Enums generate real, non-trivial runtime code",
            detail:
              "Unlike almost every other TypeScript type construct (fully erased at compile time), a regular enum compiles to an actual runtime JavaScript object — it exists at runtime, adds to bundle size, and (for numeric enums specifically) creates a reverse mapping most people don't expect or need.",
          },
          {
            title: "Numeric enums have a real safety hole",
            detail:
              "A numeric enum's underlying type is effectively just number — TypeScript will accept ANY number where that enum type is expected, not just the enum's own defined members, which silently defeats a lot of the safety an enum implies it's providing.",
          },
        ],
      },
      {
        heading: "A string literal union — the common alternative",
        points: [
          {
            title: "Purely compile-time, no runtime footprint, and this app's own convention",
            detail:
              "type ReadyState = 'idle' | 'loading' | 'success' | 'error' gives the same 'restricted set of named values' safety as an enum, is fully erased at compile time (zero runtime cost), and doesn't have the numeric-enum safety hole. This app's own code consistently uses literal unions (Algorithm, Phase, ReadyState-style types) rather than enums anywhere in the codebase.",
            code: `// this app's actual pattern, e.g. in the rate-limit and sharding animations
type Algorithm = "fixed-window" | "token-bucket";
type Phase = "naive" | "salted";
// never TypeScript enums, anywhere in this codebase`,
            codeLanguage: "typescript",
          },
        ],
      },
    ],
    closingTip: "State the concrete reason, not just the preference: 'string literal unions have zero runtime footprint and no numeric-enum safety hole — enums are the one TypeScript construct that isn't fully erased, and that has real, avoidable consequences.'",
  },
  {
    slug: "typescript-incremental-migration-from-js",
    question: "How would you incrementally migrate an existing JavaScript codebase to TypeScript, without a big-bang rewrite?",
    category: "TypeScript",
    round: "general",
    summary:
      "allowJs plus checkJs lets TypeScript and JavaScript files coexist in one project during the migration — convert file by file (leaves first, since they have fewer internal dependencies to type), starting with strict mode OFF and tightening it once the bulk of the codebase is converted, not before.",
    intro: "Architecture-level — this repo is a real, live example of the STARTING state of exactly this scenario: a TypeScript frontend next to a plain JavaScript backend, never converted, which is itself worth naming.",
    sections: [
      {
        heading: "The mechanism that makes incremental migration possible",
        points: [
          {
            title: "allowJs + checkJs — .js and .ts files coexist during the transition",
            detail:
              "Setting allowJs: true in tsconfig.json lets the TypeScript compiler include plain .js files in the same project as .ts files — checkJs: true additionally type-checks those .js files using JSDoc-comment type annotations, giving partial safety even before a file is actually renamed to .ts. This is what avoids the false choice between 'stay 100% JS' and 'convert everything at once'.",
          },
        ],
      },
      {
        heading: "The practical migration order",
        points: [
          {
            title: "Leaves first — files with the fewest internal dependencies to type correctly",
            detail:
              "Converting a leaf utility file (few or no imports from other project files) is far easier than converting a file that imports from a dozen still-untyped files, since there's less to correctly type on the way. Working from leaves inward means each conversion gets progressively easier as more of its dependencies are already typed.",
          },
          {
            title: "Start with strict mode OFF, tighten it after the bulk of the migration",
            detail:
              "Enabling strict mode on day one of a migration means every converted file has to satisfy the full strictness bar immediately — often impractical mid-migration. Converting file-by-file with strict mode off first, and only tightening it (starting with noImplicitAny and strictNullChecks specifically, the two highest-value flags) once most of the codebase is converted, keeps the migration incremental in both dimensions: file-by-file AND strictness-level-by-level.",
          },
        ],
      },
      {
        heading: "This exact scenario, right now, in this repo",
        points: [
          {
            title: "The web/ frontend is TypeScript; express-production-api is still plain JavaScript",
            detail:
              "This repo is literally the starting point of this exact migration, never carried out — the backend could go through precisely this process (allowJs/checkJs, leaf-first conversion of utils/ and services/, strict mode tightened afterward) if it were ever migrated to TypeScript.",
          },
        ],
      },
    ],
    closingTip: "If asked to demonstrate you understand the tradeoff of NOT migrating: naming that this repo's own backend/frontend split is a real, live example of the 'before' state of exactly this question is a concrete, honest way to close the answer.",
  },
];
