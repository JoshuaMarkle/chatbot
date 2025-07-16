import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";

import "@/app/globals.css";

export const metadata = {
  title: "UVA Career Center Chatbot",
  description: "Chatbot for UVA Career Center",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head></head>
      <body
        className={`${GeistSans.className} ${GeistSans.variable} ${GeistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
