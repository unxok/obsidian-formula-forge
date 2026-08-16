import { ReactNode } from "react";

export default async function RootElement({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="description" content="an Obsidian plugin" />
        <meta name="og:site_name" content="Formula Forge" />
        <link
          rel="icon"
          type="image/ico"
          href="/images/light-favicon.ico"
          media="(prefers-color-scheme: light)"
        />
        <link
          rel="icon"
          type="image/ico"
          href="/images/dark-favicon.ico"
          media="(prefers-color-scheme: dark)"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,400;0,700;1,400;1,700&display=swap"
          precedence="font"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

export const getConfig = async () => {
  return {
    render: "static",
  } as const;
};
