"use client";

import { ChevronsLeft } from "lucide-react";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { TocItem } from "rehype-mdx-toc";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar";

export const TocProvider = ({
  children,
  toc,
}: {
  children: ReactNode;
  toc: TocItem[] | undefined;
}): ReactNode => {
  const [activeHeading, setActiveHeading] = useState("");

  const nestedToc = useMemo(() => {
    const withActive = (toc ?? []).map((item) => ({
      ...item,
      isActive: item.id === activeHeading,
    }));
    if (!activeHeading && withActive[0]) {
      withActive[0].isActive = true;
    }
    return nestTocByDepth(withActive);
  }, [toc, activeHeading]);

  const onScroll = (e: Event) => {
    const appEl = e.target as null | (EventTarget & HTMLElement);
    if (!appEl) return;
    const { top: appTop } = appEl.getBoundingClientRect();
    let closestDistance: number | null = null;
    let closestId: string | null = null;
    toc?.forEach(({ id }) => {
      if (!id) return;
      const headingEl = document.getElementById(id);
      if (!headingEl) return;
      const { top } = headingEl.getBoundingClientRect();
      closestDistance ??= top;
      closestId ??= id;
      if (top < appTop + 50 && top > closestDistance) {
        closestDistance = top;
        closestId = id;
      }
    });
    setActiveHeading((prev) => closestId ?? prev);
  };

  useEffect(() => {
    if (!document) return;
    const appEl = document.getElementById("app");
    if (!appEl) return;
    appEl.addEventListener("scroll", onScroll);
    return () => {
      appEl.removeEventListener("scroll", onScroll);
    };
  }, [toc]);

  return (
    <SidebarProvider className="justify-between md:*:data-[slot=sidebar]:hidden lg:*:data-[slot=sidebar]:block *:[data-slot=sidebar]:hidden">
      {children}
      <SidebarTrigger
        size={"default"}
        variant={"ghost"}
        className={
          "fixed top-[calc(var(--spacing-header)+var(--spacing)*2)] right-4 w-fit md:hidden"
        }
      >
        On this page
        <ChevronsLeft />
      </SidebarTrigger>
      <Sidebar className="mt-header border-none *:bg-transparent" side="right">
        <SidebarContent className="">
          <SidebarGroup>
            <SidebarGroupLabel>On this page</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {nestedToc[0]?.children.map((node) => (
                  <Heading key={node.id} node={node} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  );
};

const Heading = ({
  node: { id, value, isActive, children },
}: {
  node: TreeNode;
}) => {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        data-active={isActive}
        render={<a href={`#${id}`}>{value}</a>}
      />
      {!!children.length && (
        <SidebarMenuSub
          className={"has-data-[active=true]:border-primary transition-colors"}
        >
          {children.map((node) => (
            <Heading key={node.id} node={node} />
          ))}
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  );
};

type TreeNode = TocItem & { children: TreeNode[]; isActive?: boolean };

/**
 * Converts a flat array of TocItems into a nested one to allow for easier rendering
 *
 * @note This assumes you are passing in either none or a single level one heading
 */
const nestTocByDepth = (
  toc: (TocItem & { isActive?: boolean })[],
): TreeNode[] => {
  const roots: TreeNode[] = [];
  const stack: TreeNode[] = [];

  if (toc[0]?.depth !== 1) {
    // No H1 was provided, so add dummy
    const root: TreeNode = {
      id: "root",
      depth: 1,
      value: "root",
      numbering: [],
      children: [],
      isActive: false,
    };
    toc.unshift(root);
  }

  for (const item of toc) {
    const { depth } = item;
    const node: TreeNode = { ...item, children: [] };

    stack.length = Math.min(stack.length, depth - 1);

    if (stack.length === 0) {
      roots.push(node);
    } else {
      stack[stack.length - 1]?.children.push(node);
    }

    stack[depth - 1] = node;
  }

  return roots;
};
