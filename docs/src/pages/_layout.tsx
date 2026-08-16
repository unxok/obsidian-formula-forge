// import { Header } from "~/components/Header";
import "~/styles.css";
import type { ReactNode } from "react";
import { Header } from "~/pages/_components/header";
import { Footer } from "~/pages/_components/footer";

type RootLayoutProps = { children: ReactNode };

export default async function RootLayout({ children }: RootLayoutProps) {
  return (
    <div
      id="app"
      className="bg-background fixed inset-0 overflow-auto scroll-smooth font-['Nunito'] transition-colors"
    >
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}

export const getConfig = async () => {
  return {
    render: "static",
  } as const;
};
