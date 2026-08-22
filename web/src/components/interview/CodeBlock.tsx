import { Highlight, themes } from "prism-react-renderer";

export function CodeBlock({
  code,
  language = "javascript",
}: {
  code: string;
  language?: string;
}) {
  return (
    <Highlight code={code.trim()} language={language} theme={themes.nightOwl}>
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <pre
          className={`${className} overflow-x-auto rounded-lg border border-zinc-800 p-3 text-xs leading-6`}
          style={style}
        >
          {tokens.map((line, i) => {
            const { className: lineClassName, ...lineProps } = getLineProps({
              line,
            });
            return (
              <div key={i} {...lineProps} className={lineClassName}>
                <span className="mr-3 inline-block w-5 select-none text-right text-zinc-600">
                  {i + 1}
                </span>
                {line.map((token, tokenIndex) => (
                  <span key={tokenIndex} {...getTokenProps({ token })} />
                ))}
              </div>
            );
          })}
        </pre>
      )}
    </Highlight>
  );
}
