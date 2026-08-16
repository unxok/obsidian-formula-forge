import { FormulaForgeIcon } from "~/components/FormulaForgeIcon";
import { ReactNode } from "react";
import { ThemeSwitcher } from "~/components/ThemeSwitcher";
import { buttonVariants } from "~/components/ui/button";
import { BuyMeACoffee } from "~/components/BuyMeACoffee";
import { Unstable_InferredPaths as InferredPaths } from "waku/router/client";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";
import { Menu } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
} from "~/components/ui/sidebar";
import { cn } from "~/lib/utils";
import { NavLink } from "~/components/NavLink";
import { Link as InternalLink } from "waku";

export const Header = (): ReactNode => {
  return (
    <header className="bg-background z-header h-header sticky top-0 flex w-full items-center justify-between gap-4 p-4 transition-colors">
      <div className="flex items-center gap-4">
        <span className="text-lg font-bold tracking-tight sm:text-xl">
          <InternalLink to="/" className="flex items-center gap-1">
            <FormulaForgeIcon size={20} />
            <span>Formula Forge</span>
          </InternalLink>
        </span>
        <nav className="hidden items-center md:flex">
          {navLinks.map((props, i) => (
            <Link key={"desktop-nav-item" + i} {...props} />
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-2">
        <BuyMeACoffeeLink className="hidden md:flex" />
        <ThemeSwitcher />
        <Sheet>
          <SheetTrigger
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "md:hidden",
            )}
          >
            <Menu />
          </SheetTrigger>
          <SheetContent id="header-sheet-content">
            <SheetHeader aria-hidden>
              <SheetTitle>
                <span className="text-lg font-bold tracking-tight sm:text-xl">
                  <Link to="/" className="flex items-center gap-1">
                    <FormulaForgeIcon size={20} />
                    <span>Formula Forge</span>
                  </Link>
                </span>
              </SheetTitle>
            </SheetHeader>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navLinks.map((props, i) => (
                    <SidebarMenuItem key={"mobile-nav-item" + i}>
                      <Link {...props} className="w-full justify-start" />
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SheetFooter>
              <BuyMeACoffeeLink />
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};

const navLinks: LinkProps[] = [
  {
    children: "Download",
    href: "obsidian://show-plugin?id=formula-forge",
  },
  {
    children: "Docs",
    to: "/docs/introduction",
  },
  {
    children: "Changelog",
    to: "/changelog",
  },
  {
    children: "Github",
    href: "https://github.com/unxok/obsidian-formula-forge",
  },
];

type LinkProps = {
  children: ReactNode;
  className?: string;
} & (
  | { href: string; to?: undefined }
  | { href?: undefined; to: InferredPaths }
);

const Link = ({ children, className, href, to }: LinkProps): ReactNode => {
  const defaultClassName = cn(
    buttonVariants({ variant: "link" }),
    "data-[active=true]:bg-secondary",
    className,
  );

  return (
    <>
      {!!href && (
        <a className={defaultClassName} href={href}>
          {children}
        </a>
      )}
      {!!to && (
        <NavLink className={defaultClassName} to={to}>
          {children}
        </NavLink>
      )}
    </>
  );
};

const BuyMeACoffeeLink = ({ className }: { className?: string }): ReactNode => (
  <a
    href="https://buymeacoffee.com/unxok"
    className={cn(buttonVariants({ variant: "ghost" }), className)}
  >
    <BuyMeACoffee />
    <span>Buy me a coffee</span>
  </a>
);
