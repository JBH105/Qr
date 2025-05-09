import { Geist, Geist_Mono } from "next/font/google";
import { Roboto, Lobster } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const roboto = Roboto({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-roboto",
});

const lobster = Lobster({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-lobster",
});

export const metadata = {
  title: "Generate QR Codes",
  description: "Generate QR Codes easily on our website. Enter the QR Code name and define the range (start to end) to create multiple codes. Save the generated QR Codes in DFX format for easy use.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${roboto.variable} ${lobster.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
