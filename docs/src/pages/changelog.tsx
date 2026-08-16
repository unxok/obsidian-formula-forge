import { ReactNode } from "react";
import { default as Md, toc } from "../../../changelog.md";
import { TocProvider } from "~/components/TocProvider";
import { OpenGraph } from "~/components/OpenGraph";

export default function (): ReactNode {
  return (
    <div className="">
      <OpenGraph
        title="Changelog"
        description="See what's changed after each release"
        updated="TODO"
      />
      <TocProvider toc={toc}>
        <div className="flex w-full justify-center">
          <div className="prose dark:prose-invert w-full max-w-[70ch] px-6 py-4">
            <Md />
          </div>
        </div>
      </TocProvider>
    </div>
  );
}

export const getConfig = async () => {
  return {
    render: "static",
  } as const;
};
