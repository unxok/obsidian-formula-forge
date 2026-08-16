"use client";

import { ReactNode, useEffect, useState } from "react";

type Props = Partial<typeof import("*.mdx").frontmatter>;

export const OpenGraph = ({ title, description }: Props): ReactNode => {
  const [url, setUrl] = useState<string>();

  useEffect(() => {
    if (!window) return;

    const relativePath = `/og-image?title=${encodeURIComponent(title ?? "")}&description=${encodeURIComponent(description ?? "")}`;

    setUrl(window.origin + relativePath);
  }, []);

  return (
    <>
      <meta property="og:title" content={title ?? "Formula Forge"} />
      <meta
        property="og:description"
        content={description ?? "Take Obsidian formulas even further"}
      />
      {!!url && <meta property="og:image" content={url} />}
    </>
  );
};
