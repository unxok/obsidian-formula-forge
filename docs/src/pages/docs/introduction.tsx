import { ReactNode } from "react";
import { Article } from "~/components/Article";
import * as mdx from "~/pages/docs/introduction.mdx";

export default function (): ReactNode {
  return <Article {...mdx} />;
}
