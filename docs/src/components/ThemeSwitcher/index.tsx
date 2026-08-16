"use client";

import { parseCookie, stringifyCookie } from "cookie";
import { Moon, Sun } from "lucide-react";
import { ReactNode, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { THEME_COOKIE } from "~/lib/constants";

export type Theme = "dark" | "light";

export const themeKey = "ff-theme";

let theme: Theme = "dark";

/**
 * A button to switch the dark mode theme
 */
export const ThemeSwitcher = (): ReactNode => {
  const updateStorage = (t: Theme) => {
    // window.localStorage.setItem(themeKey, t);
    const setCookie = stringifyCookie({ [THEME_COOKIE]: t });
    document.cookie = setCookie;
  };

  useEffect(() => {
    // const stored = window.localStorage.getItem(themeKey) as Theme | null;
    const stored = parseCookie(document.cookie)[THEME_COOKIE] as
      | Theme
      | undefined;
    const preferred: Theme = window.matchMedia("(prefers-color-scheme: dark)")
      .matches
      ? "dark"
      : "light";
    const initial = stored || preferred;
    if (!stored) {
      updateStorage(initial);
    }
    theme = initial;
    onThemeChange(initial);
  }, []);

  const onThemeChange = (t: Theme) => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(t);
  };

  return (
    <Button
      title="Change theme"
      variant={"ghost"}
      size={"icon"}
      onClick={() => {
        theme = theme === "dark" ? "light" : "dark";
        onThemeChange(theme);
        updateStorage(theme);
      }}
    >
      <Sun className="size-5 not-dark:hidden" />
      <Moon className="size-5 dark:hidden" />
    </Button>
  );
};
