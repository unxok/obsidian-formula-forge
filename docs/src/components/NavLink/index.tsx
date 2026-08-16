"use client";

import { ComponentProps, useEffect, useState } from "react";
import { Link, useRouter } from "waku";
import { Unstable_ChangeRouteCallback as ChangeRouteCallback } from "waku/router/client";

export const NavLink = ({ to, ...props }: ComponentProps<typeof Link>) => {
  const [isActive, setIsActive] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!window) return;

    setIsActive(() => window.location.pathname === to);

    const updateActive: ChangeRouteCallback = ({ path }) => {
      setIsActive(() => path === to);
    };

    router.unstable_events.on("complete", updateActive);

    return () => {
      router.unstable_events.off("complete", updateActive);
    };
  }, [to, router]);

  return <Link data-active={isActive} to={to} {...props} />;
};
