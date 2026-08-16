import { ReactNode } from "react";
import { Link } from "waku";
import { FormulaForgeIcon } from "~/components/FormulaForgeIcon";

export const Footer = () => {
  return (
    <footer>
      {/* <div className="fixed right-0 bottom-0 p-6">Made with &lt;3 by Unxok</div> */}
      <div className="flex flex-wrap justify-evenly gap-12 bg-neutral-950 p-12">
        <div className="text-neutral-400">
          <div className="text-lg font-bold tracking-tight sm:text-xl">
            <Link to="/" className="dark flex items-center gap-1">
              <FormulaForgeIcon size={20} />
              <span>Formula Forge</span>
            </Link>
          </div>
          <ul className="pt-4">
            <li>© 2026 Unxok</li>
            <li>Free and open source under MIT license</li>
            <li>Made with &lt;3</li>
          </ul>
        </div>
        <div className="flex flex-wrap gap-12">
          <FooterSection
            title={"Getting started"}
            links={[
              <Link to="/">Overview</Link>,
              <Link to="/docs/introduction">Quick start</Link>,
            ]}
          />
          <FooterSection
            title={"Resources"}
            links={[
              <a href="https://community.obsidian.md/plugins/formula-forge">
                Obsidian Community
              </a>,
              <a href="https://github.com/unxok/obsidian-formula-forge">
                Github repository
              </a>,
            ]}
          />
          <FooterSection
            title={"Contribute"}
            links={[
              <a href="https://github.com/unxok/obsidian-formula-forge/issues/new?template=bug_report.md">
                Report a bug
              </a>,
              <a href="https://github.com/unxok/obsidian-formula-forge/issues/new?template=feature_request.md">
                Request a feature
              </a>,
              <a href="https://github.com/unxok/obsidian-formula-forge/issues/new?template=question---discussion.md">
                Ask a question
              </a>,
              <a href="https://buymeacoffee.com/unxok">Buy me a coffee</a>,
            ]}
          />
        </div>
      </div>
    </footer>
  );
};

const FooterSection = ({
  title,
  links,
}: {
  title: ReactNode;
  links: ReactNode[];
}): ReactNode => (
  <ul className="text-neutral-200">
    <li className="mb-2 text-neutral-400">{title}</li>
    {links.map((l, i) => (
      <li key={title + "-footer-link-" + i}>{l}</li>
    ))}
  </ul>
);
