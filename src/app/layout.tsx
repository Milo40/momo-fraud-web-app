import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/css/style.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Chatbox",
  description: "A chat interface",
  generator: "",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="w-screen flex h-screen antialiased">{children}</div>
      </body>
    </html>
  );
}
