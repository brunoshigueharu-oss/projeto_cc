import type { Metadata } from "next";
import { Nunito_Sans, Poppins } from "next/font/google";

import { CartProvider } from "@/lib/cart/cart-context";
import { MemberProvider } from "@/lib/wix/member-context";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Hocus Pocus",
    template: "%s · Hocus Pocus",
  },
  description: "Editora de ficção sombria ilustrada.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${poppins.variable} ${nunitoSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <a
          href="#main-content"
          className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:left-4 focus-visible:top-4 focus-visible:z-50 focus-visible:rounded-md focus-visible:bg-primary focus-visible:px-4 focus-visible:py-2 focus-visible:text-sm focus-visible:font-medium focus-visible:text-primary-foreground"
        >
          Pular para o conteúdo
        </a>
        <MemberProvider>
          <CartProvider>{children}</CartProvider>
        </MemberProvider>
      </body>
    </html>
  );
}
