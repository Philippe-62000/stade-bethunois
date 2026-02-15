import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stade Béthunois - Gestion des présences",
  description: "Application de gestion des présences pour le club de foot Stade Béthunois",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
