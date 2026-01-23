"use client";

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { CopyButton } from "./CopyButton";

interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language = "tsx" }: CodeBlockProps) {
  const lineCount = code.split("\n").length;

  return (
    <div className="relative group rounded-lg overflow-hidden">
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <span className="text-xs text-cream-100/40 bg-ink/80 px-2 py-1 rounded backdrop-blur-sm">
          {language}
        </span>
        <CopyButton text={code} />
      </div>
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{
          margin: 0,
          borderRadius: "0.5rem",
          padding: "1.5rem",
          paddingTop: "3.5rem",
          fontSize: "0.875rem",
          lineHeight: "1.6",
          border: "1px solid rgba(255, 252, 248, 0.05)",
        }}
        showLineNumbers={lineCount > 10}
        wrapLines={true}
        wrapLongLines={false}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
