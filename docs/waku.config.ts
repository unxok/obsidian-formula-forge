import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "waku/config";
import mdx from "@mdx-js/rollup";
import rehypeSlug from "rehype-slug";
import rehypeMdxToc from "rehype-mdx-toc";
import rehypeAutoLinkHeadings from "rehype-autolink-headings";
import recmaExportFilepath from "recma-export-filepath";
import remarkGfm from "remark-gfm";
import rehypeStarryNight from "rehype-starry-night";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";

export default defineConfig({
  vite: {
    plugins: [
      mdx({
        remarkPlugins: [remarkGfm, remarkFrontmatter, remarkMdxFrontmatter],
        rehypePlugins: [
          rehypeSlug,
          rehypeMdxToc,
          rehypeAutoLinkHeadings,
          rehypeStarryNight,
        ],
        recmaPlugins: [recmaExportFilepath],
      }),
      tailwindcss(),
      react(),
      babel({ presets: [reactCompilerPreset()] }),
    ],
    resolve: {
      tsconfigPaths: true,
    },
    optimizeDeps: {
      exclude: ["@resvg/resvg-js"],
    },
  },
});
