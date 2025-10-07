import { Inter, Manrope } from "next/font/google";

export const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

export const fontClassName = `${inter.variable} ${manrope.variable}`;
