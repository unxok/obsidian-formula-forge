import { ReactNode } from "react";
import { Link } from "waku";
import { Background } from "~/components/Background";
import { OpenGraph } from "~/components/OpenGraph";
import { buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";

export default async function (): Promise<ReactNode> {
  return (
    <div className="mx-auto flex w-full flex-col items-center justify-center">
      <OpenGraph />
      <Background />
      <Hero />
      <div className="w-full py-12">
        <div className="mx-auto flex w-full max-w-[100ch] flex-col gap-16 px-8 pt-8">
          <LivePreview />
          <CustomFunctions />
          <NewGlobalFunctions />
        </div>
      </div>
    </div>
  );
}

export const getConfig = async () => {
  return {
    render: "static",
  };
};

const Hero = (): ReactNode => (
  <div className="flex w-full flex-col justify-center gap-2 px-8 pt-24 text-center text-balance">
    <title>Formula Forge</title>
    <h2 className="font-inter pb-1 text-3xl font-extrabold tracking-tight sm:text-4xl md:text-4xl lg:text-5xl">
      Take Obsidian{" "}
      <span className="bg-linear-135 from-amber-400 to-amber-800 bg-clip-text [-webkit-text-fill-color:transparent] dark:from-amber-200 dark:to-amber-600">
        formulas
      </span>{" "}
      even further
    </h2>
    <p>
      Display live formulas in your notes, add global formulas, create custom
      functions, and more!
    </p>
    <div className="flex w-full flex-wrap justify-center gap-1">
      <a
        href="obsidian://show-plugin?id=formula-forge"
        className={cn(
          buttonVariants(),
          "bg-[hsl(262,83%,58%)] text-white hover:bg-[hsl(262,83%,63%)] dark:hover:bg-[hsl(262,83%,53%)]",
        )}
      >
        Add to Obsidian
      </a>
      <Link className={buttonVariants()} to="/docs/introduction">
        Read the docs
      </Link>
    </div>
  </div>
);

const Feature = ({
  heading,
  description,
  visual,
}: {
  heading: ReactNode;
  description: ReactNode;
  visual: ReactNode;
}): ReactNode => (
  <div className="flex flex-wrap items-center justify-evenly gap-6 text-balance lg:even:flex-row-reverse">
    <div className="">
      <h3 className="font-inter text-xl font-extrabold">{heading}</h3>
      <p className="max-w-[40ch]">{description}</p>
    </div>
    {visual}
  </div>
);

const LivePreview = (): ReactNode => (
  <Feature
    heading={"Live preview formulas"}
    description={
      "Show formulas in your notes which automatically update when file metadata changes."
    }
    visual={
      <>
        <img
          src="/images/live-preview-formulas-dark.png"
          width={450}
          className="not-dark:hidden"
        />
        <img
          src="/images/live-preview-formulas-light.png"
          width={450}
          className="dark:hidden"
        />
      </>
    }
  />
);

const CustomFunctions = (): ReactNode => (
  <Feature
    heading={"Custom functions"}
    description={
      "Create your own custom functions which come with autocomplete and validation. Use these functions anywhere formulas are used, just like any other global function."
    }
    visual={
      <>
        <img
          src="/images/custom-function-autocomplete-dark.png"
          width={475}
          className="not-dark:hidden"
        />
        <img
          src="/images/custom-function-autocomplete-light.png"
          width={475}
          className="dark:hidden"
        />
      </>
    }
  />
);

const NewGlobalFunctions = (): ReactNode => (
  <Feature
    heading={"New global functions"}
    description={
      "Additional global functions have been added, making it possible to things like render markdown and define local variables."
    }
    visual={
      <>
        <img
          src="/images/new-global-functions-dark.png"
          width={450}
          className="not-dark:hidden"
        />
        <img
          src="/images/new-global-functions-light.png"
          width={450}
          className="dark:hidden"
        />
      </>
    }
  />
);
