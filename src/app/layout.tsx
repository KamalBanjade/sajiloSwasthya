import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import { ThemeProvider, ThemeScript } from "@/components/theme/ThemeProvider";
import { ConfirmProvider } from "@/context/ConfirmContext";
import QueryProvider from "@/components/providers/QueryProvider";
import { PatientScanReceiver } from "@/components/scanner/PatientScanReceiver";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sajilo स्वास्थ्य",
  description: "Next-generation secure medical record management with QR-based identification.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevents white flash on dark-mode page load */}
        <ThemeScript />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Amita:wght@400;700&family=Geist+Mono:wght@100..900&family=Geist:wght@100..900&family=Gotu&family=Mukta:wght@200;300;400;500;600;700;800&family=Tiro+Devanagari+Hindi:ital,wght@0,400;1,400&family=Yatra+One&display=swap" rel="stylesheet" />
      </head>
      <body 
        className="antialiased"
        style={{
          '--font-geist-sans': '"Geist", sans-serif',
          '--font-geist-mono': '"Geist Mono", monospace',
          '--font-mukta': '"Mukta", sans-serif',
          '--font-yatra': '"Yatra One", cursive',
          '--font-amita': '"Amita", cursive',
          '--font-tiro': '"Tiro Devanagari Hindi", serif',
          '--font-gotu': '"Gotu", sans-serif',
        } as React.CSSProperties}
      >
        <ThemeProvider>
          <QueryProvider>
            <ConfirmProvider>
              <Toaster
                position="top-right"
                toastOptions={{
                  className: 'react-hot-toast',
                  style: {
                    background: 'var(--surface)',
                    color: 'var(--foreground)',
                    border: '1px solid var(--border)',
                  },
                  success: {
                    iconTheme: {
                      primary: 'var(--secondary)',
                      secondary: 'white',
                    },
                  },
                }}
              />
              {children}
              <PatientScanReceiver />
            </ConfirmProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
