import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TuCasa · Buscador inmobiliario para empresas",
  description: "Búsqueda inmobiliaria privada en Santa Cruz. Beta con propiedades ficticias, mapa, filtros y otras publicaciones.", robots: { index: false, follow: false },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
