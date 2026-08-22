import { Highlight, themes } from "prism-react-renderer";

export function CodePanel({
  code,
  activeLine,
  activeLineEnd,
}: {
  code: string;
  activeLine: number;
  activeLineEnd?: number;
}) {
  const endLine = activeLineEnd ?? activeLine;

  return (
    <Highlight
      code={code.replace(/\n$/, "")}
      language="javascript"
      theme={themes.nightOwl}
    >
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <pre
          className={`${className} overflow-x-auto rounded-lg border border-zinc-800 p-3 text-xs leading-6`}
          style={style}
        >
          {tokens.map((line, i) => {
            const lineNumber = i + 1;
            const isActive = lineNumber >= activeLine && lineNumber <= endLine;
            const { className: lineClassName, ...lineProps } = getLineProps({
              line,
            });
            return (
              <div
                key={lineNumber}
                {...lineProps}
                className={`${lineClassName} -mx-3 flex gap-3 border-l-2 px-3 ${
                  isActive
                    ? "border-sky-400 bg-sky-500/15"
                    : "border-transparent"
                }`}
              >
                <span className="w-5 shrink-0 select-none text-right text-zinc-600">
                  {lineNumber}
                </span>
                <span>
                  {line.map((token, tokenIndex) => (
                    <span key={tokenIndex} {...getTokenProps({ token })} />
                  ))}
                </span>
              </div>
            );
          })}
        </pre>
      )}
    </Highlight>
  );
}
