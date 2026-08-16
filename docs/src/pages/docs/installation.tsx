import { ReactNode } from "react";
import { Article } from "~/components/Article";
import * as mdx from "~/pages/docs/installation.mdx";

export default function (): ReactNode {
  return <Article {...mdx} />;
}
