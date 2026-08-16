declare module "*.mdx" {
  import { Element, MDXContent } from "mdx/types";
  import { TocItem } from "rehype-mdx-toc";

  export const toc: undefined | TocItem[];
  export const filepath: string;
  export const frontmatter: {
    title: string;
    description: string;
    order: number;
    updated: string;
    group: string;
  };
  export default function MDXContent(props: MDXProps): Element;
}

declare module "*.md" {
  import { Element, MDXContent } from "mdx/types";
  import { TocItem } from "rehype-mdx-toc";

  export const toc: undefined | TocItem[];
  export const filepath: string;
  export const frontmatter: {
    title: string;
    description: string;
    updated: string;
    group: string;
  };
  export default function MDXContent(props: MDXProps): Element;
}
