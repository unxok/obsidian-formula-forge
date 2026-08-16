import { ChevronsRight } from "lucide-react";
import { ReactNode } from "react";
import { SidebarNav } from "~/pages/docs/_components/sidebar-nav";
import { SidebarProvider, SidebarTrigger } from "~/components/ui/sidebar";

export default function ({ children }: { children: ReactNode }): ReactNode {
  return (
    <SidebarProvider className="flex flex-col">
      <div className="top-header bg-background sticky w-full border-t p-2 md:hidden">
        <SidebarTrigger
          size={"default"}
          variant={"ghost"}
          className={"w-fit md:hidden"}
        >
          <ChevronsRight />
          <span>Docs</span>
        </SidebarTrigger>
      </div>
      <div className="flex">
        <SidebarNav />
        {children}
      </div>
    </SidebarProvider>
  );
}

export const getConfig = async () => {
  return {
    render: "static",
  } as const;
};
