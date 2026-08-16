import { ComponentProps, ReactNode } from "react";
import { cn } from "~/lib/utils";

export const FormulaForgeIcon = ({
  className,
  size,
  ...props
}: ComponentProps<"span"> & { size?: number }): ReactNode => (
  <span {...props} className={cn("", className)}>
    <Light size={size} />
    <Dark size={size} />
  </span>
);

const Light = ({ size = 24 }: { size?: number }): ReactNode => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="dark:hidden"
  >
    <path
      d="M20.5556 1H3.44444C2.09441 1 1 2.09441 1 3.44444V20.5556C1 21.9056 2.09441 23 3.44444 23H20.5556C21.9056 23 23 21.9056 23 20.5556V3.44444C23 2.09441 21.9056 1 20.5556 1Z"
      fill="black"
    />
    <path
      d="M4.66666 11.0747H19.4167"
      stroke="#FFFFFF"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M4.66666 18.1636C7.1111 18.1636 8.08888 16.9414 8.08888 14.7414V9.60809C8.08888 7.16365 9.3111 5.57476 12 5.94142"
      stroke="#FFFFFF"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 18.1636C14.4444 18.1636 15.4222 16.9414 15.4222 14.7414V9.60809C15.4222 7.16365 16.6444 5.57476 19.3333 5.94142"
      stroke="#FFFFFF"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const Dark = ({ size = 24 }: { size?: number }): ReactNode => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="not-dark:hidden"
  >
    <path
      d="M20.5556 1H3.44444C2.09441 1 1 2.09441 1 3.44444V20.5556C1 21.9056 2.09441 23 3.44444 23H20.5556C21.9056 23 23 21.9056 23 20.5556V3.44444C23 2.09441 21.9056 1 20.5556 1Z"
      fill="#FFFFFF"
    />
    <path
      d="M4.66666 11.0747H19.4167"
      stroke="black"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M4.66666 18.1636C7.1111 18.1636 8.08888 16.9414 8.08888 14.7414V9.60809C8.08888 7.16365 9.3111 5.57476 12 5.94142"
      stroke="black"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 18.1636C14.4444 18.1636 15.4222 16.9414 15.4222 14.7414V9.60809C15.4222 7.16365 16.6444 5.57476 19.3333 5.94142"
      stroke="black"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
