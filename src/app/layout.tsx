import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Karla } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const karla = Karla({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "NexaFinance — Modern Financial Intelligence",
  description: "Platform pencatatan keuangan cerdas pribadi & bisnis berbasis AI dengan notifikasi WhatsApp real-time.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${plusJakartaSans.variable} ${karla.variable}`}>
      <body className="min-h-screen flex flex-col bg-[#ffffff] text-[#000000]">
        {children}
      </body>
    </html>
  );
}
