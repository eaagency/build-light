import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "BuildLight - Construction Management That Gets Out of Your Way",
  description: "Organize construction projects in 1 hour, not 100. Built for residential builders.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className="font-sans antialiased">
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
          <Toaster
            position="bottom-right"
            reverseOrder={false}
            gutter={8}
            containerStyle={{
              bottom: 20,
              right: 20,
            }}
            toastOptions={{
              className: "",
              style: {
                background: "#121212",
                color: "#FFFFFF",
                borderRadius: "8px",
                padding: "16px",
                fontSize: "14px",
                fontWeight: "500",
              },
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
