import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fuga, SA ✈️",
  description: "A ferramenta para planear viagens épicas com amigos",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body className="bg-slate-950 text-white antialiased">{children}</body>
    </html>
  );
}
