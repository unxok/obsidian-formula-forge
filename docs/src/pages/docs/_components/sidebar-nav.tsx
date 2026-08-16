import { ComponentProps, ReactNode } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton as SidebarMenuButtonBase,
  SidebarMenuItem,
} from "~/components/ui/sidebar";
import { NavLink } from "~/components/NavLink";
import { Unstable_InferredPaths as InferredPaths } from "waku/router/client";
import { readdir } from "fs/promises";
import { parse as parseYaml } from "yaml";
import { createReadStream } from "fs";
import { createInterface } from "readline/promises";

/**
 * The order which groups are sorted in navigation
 */
const groupsOrder: string[] = ["Getting started", "Features"];

/**
 * A navigation sidebar for pages in /docs
 */
export const SidebarNav = async (): Promise<ReactNode> => {
  const groups = Object.groupBy(await getPagesInfo(), (item) => item.group);
  const groupsOrderRecord = groupsOrder.reduce(
    (acc, group, order) => {
      acc[group] = order;
      return acc;
    },
    {} as Record<string, number>,
  );
  const groupEntries = Object.entries(groups).toSorted(([a], [b]) => {
    const aOrder = groupsOrderRecord[a];
    const bOrder = groupsOrderRecord[b];
    if (aOrder === undefined) {
      throw new Error(`Group order not found for "${a}"`);
    }
    if (bOrder === undefined) {
      throw new Error(`Group order not found for "${b}"`);
    }
    return aOrder - bOrder;
  });

  return (
    <Sidebar className="mt-header border-r px-2 [--sidebar:transparent]">
      <SidebarContent className="">
        {groupEntries.map(([group, pages]) => (
          <SidebarGroup key={"docs-group-" + group}>
            <SidebarGroupLabel>{group}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {pages?.map((child, i) => (
                  <SidebarMenuItem key={"docs-group-page-" + group + i}>
                    <NavLink to={child.to}>
                      <SidebarMenuButton>{child.title}</SidebarMenuButton>
                    </NavLink>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
};

/**
 * SidebarMenuButton wrapper to style when it contains an active link
 */
const SidebarMenuButton = (
  props: ComponentProps<typeof SidebarMenuButtonBase>,
) => (
  <SidebarMenuButtonBase {...props} className="in-data-active:bg-secondary" />
);

type PageInfo = {
  to: InferredPaths;
  title: string;
  order: number;
  group: string;
};

/**
 * Gets metadata for the pages in /docs
 */
const getPagesInfo = async (): Promise<PageInfo[]> => {
  const docsDir = new URL("../", import.meta.url);
  console.log("meta: ", import.meta.url);
  const names = (await readdir(docsDir)).filter(
    (name) => !name.startsWith("_") && name.endsWith("mdx"),
  );

  const info: PageInfo[] = [];

  for await (const name of names) {
    const path = new URL(name, docsDir);
    const frontmatterString = await getFrontmatterString(path);
    if (!frontmatterString) {
      throw new Error(`Invalid YAML detected in file at "${path}"`);
    }
    const { title, order, group } = parseYaml(
      frontmatterString,
    ) as typeof import(".mdx").frontmatter;
    const basename = name.slice(0, -4);
    const to = ("/docs/" + basename) as InferredPaths;
    info.push({ title, order, group, to });
  }

  return info.toSorted((a, b) => a.order - b.order);
};

/**
 * Parses a file using a stream to find frontmatter in a markdown document
 */
const getFrontmatterString = async (path: URL): Promise<string | null> => {
  const stream = createReadStream(path, { encoding: "utf-8" });
  const reader = createInterface({ input: stream });
  let isFirstLine = true;
  const lines: string[] = [];

  for await (const line of reader) {
    const isDashes = line === "---";

    // start of frontmatter
    if (isFirstLine && isDashes) {
      isFirstLine = false;
      continue;
    }

    // invalid frontmatter
    if (isFirstLine && !isDashes) {
      return null;
    }

    // end of frontmatter
    if (isDashes) {
      return lines.join("\n");
    }

    // between start and end
    lines.push(line);
  }

  return null;
};
