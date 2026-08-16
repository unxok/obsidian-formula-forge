import { ReactNode } from "react";
import { Link } from "waku";
import { OpenGraph } from "~/components/OpenGraph";
import { TocProvider } from "~/components/TocProvider";

export const Article = ({
  default: MdxContent,
  filepath,
  toc,
  frontmatter,
}: typeof import("*.mdx")): ReactNode => (
  <article className="flex size-full flex-col justify-between">
    <title>{frontmatter.title}</title>
    <meta property="og:title" content={frontmatter.title} />
    <meta property="og:description" content={frontmatter.description} />
    <OpenGraph {...frontmatter} />
    <TocProvider toc={toc}>
      <div className="prose dark:prose-invert w-full max-w-full px-12 py-2">
        <h1>{frontmatter.title}</h1>
        <MdxContent
          components={{
            Link,
          }}
        />
      </div>
    </TocProvider>
    <footer className="px-12 py-2">
      <a
        href={
          "https://github.com/unxok/obsidian-formula-forge/blob/main/" +
          filepath
        }
      >
        Edit on Github
      </a>
    </footer>
  </article>
);

///////////
