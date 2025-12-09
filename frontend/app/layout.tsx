import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { ProjectProvider } from "@/contexts/ProjectContext";

const inter = Inter({
    subsets: ["latin"],
    variable: '--font-inter',
});

export const metadata: Metadata = {
    title: "TaskFlow - Task Management App",
    description: "Manage your tasks efficiently with TaskFlow",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${inter.variable} font-sans antialiased`}>
                <AuthProvider>
                    <ProjectProvider>
                        <ToastProvider>
                            {children}
                        </ToastProvider>
                    </ProjectProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
