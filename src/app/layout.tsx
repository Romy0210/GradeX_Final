import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import FirebaseClientProvider from '@/firebase/client-provider';
import { StudentDataProvider } from '@/context/student-data-provider';
import { SettingsProvider } from '@/context/settings-provider';
import { AcademicStructureProvider } from '@/context/academic-structure-provider';
import { ActivityLogProvider } from '@/context/activity-log-provider';
import { CorrectionRequestProvider } from '@/context/correction-request-provider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'GradeX',
  description:
    'A student performance prediction and recommendation system using Machine Learning.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
      <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🎓</text></svg>" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body 
        className={`${inter.variable} font-body antialiased`}
        suppressHydrationWarning={true}
      >
        <FirebaseClientProvider>
          <SettingsProvider>
            <AcademicStructureProvider>
              <StudentDataProvider>
                <ActivityLogProvider>
                  <CorrectionRequestProvider>
                    <ThemeProvider
                      attribute="class"
                      defaultTheme="dark"
                      enableSystem
                      disableTransitionOnChange
                    >
                      {children}
                      <Toaster />
                    </ThemeProvider>
                  </CorrectionRequestProvider>
                </ActivityLogProvider>
              </StudentDataProvider>
            </AcademicStructureProvider>
          </SettingsProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
