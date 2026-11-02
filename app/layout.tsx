import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Next Lab — Build your intelligence",
  description: "Create, fine-tune, evaluate and deploy your own language models.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
