"use client";

import { useEffect, useState } from "react";
import { remark } from "remark";
import remarkHtml from "remark-html";

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const [html, setHtml] = useState("");

  useEffect(() => {
    async function processMarkdown() {
      const result = await remark()
        .use(remarkHtml, { sanitize: true })
        .process(content);

      setHtml(result.toString());
    }

    processMarkdown();
  }, [content]);

  return (
    <div
      className="prose prose-sm max-w-none dark:prose-invert"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
