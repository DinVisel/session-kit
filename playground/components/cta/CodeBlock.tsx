const KEYWORDS = new Set([
  "const",
  "let",
  "await",
  "new",
  "import",
  "from",
  "export",
  "async",
  "function",
  "return",
]);

interface Token {
  text: string;
  className: string;
}

function highlight(line: string): Token[] {
  const tokens: Token[] = [];
  const pattern =
    /(\/\/.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b\d+\b)|([A-Za-z_$][\w$]*)|(\s+)|([^\s\w]+)/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(line))) {
    const [, comment, string, number, word, space, punct] = match;
    if (comment) tokens.push({ text: comment, className: "text-slate-500" });
    else if (string) tokens.push({ text: string, className: "text-[var(--color-accent-gold)]" });
    else if (number) tokens.push({ text: number, className: "text-[var(--color-accent-amber)]" });
    else if (word)
      tokens.push({
        text: word,
        className: KEYWORDS.has(word) ? "text-[var(--color-accent-cyan)]" : "text-slate-200",
      });
    else if (space) tokens.push({ text: space, className: "" });
    else if (punct) tokens.push({ text: punct, className: "text-slate-500" });
  }
  return tokens;
}

export function CodeBlock({ code }: { code: string }) {
  const lines = code.split("\n");
  return (
    <pre className="overflow-x-auto rounded-lg border border-[var(--color-border-hairline)] bg-black/40 p-4 font-mono text-xs leading-relaxed">
      <code>
        {lines.map((line, i) => (
          <div key={i}>
            {line.length === 0
              ? " "
              : highlight(line).map((tok, j) => (
                  <span key={j} className={tok.className}>
                    {tok.text}
                  </span>
                ))}
          </div>
        ))}
      </code>
    </pre>
  );
}
