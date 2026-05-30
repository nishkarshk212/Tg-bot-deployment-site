import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bot Deployer",
  description: "Deploy your Telegram bots with ease",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
