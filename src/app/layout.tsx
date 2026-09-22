import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cookies } from 'next/headers';
import Link from 'next/link';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CRM 24hs",
  description: "Sistema de gestión de oportunidades para 24hs Security",
  manifest: "/manifest.json",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  return (
    <html lang="es">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
        <meta name="theme-color" content="#0f172a" />
      </head>
      <body className={`${inter.className} bg-slate-50 text-slate-900`}>
        {userId && (
          <nav className="bg-slate-900 text-white fixed bottom-0 left-0 w-full md:w-64 md:h-screen md:top-0 md:bottom-auto z-50 print:hidden">
            <div className="flex md:flex-col justify-around md:justify-start p-3 md:p-6 h-16 md:h-full gap-4">
              <div className="hidden md:block mb-8">
                <h2 className="font-black text-xl text-blue-400">24HS SECURITY</h2>
                <p className="text-xs text-slate-400 font-medium">CRM STAND</p>
              </div>
              
              <Link href="/" className="flex flex-col md:flex-row items-center gap-1 md:gap-3 text-slate-300 hover:text-white transition-colors">
                <span className="text-xl">📊</span>
                <span className="text-xs md:text-base font-medium">Dashboard</span>
              </Link>
              
              <Link href="/opportunities" className="flex flex-col md:flex-row items-center gap-1 md:gap-3 text-slate-300 hover:text-white transition-colors">
                <span className="text-xl">👥</span>
                <span className="text-xs md:text-base font-medium">Oportunidades</span>
              </Link>
              
              <Link href="/alarms" className="flex flex-col md:flex-row items-center gap-1 md:gap-3 text-slate-300 hover:text-white transition-colors">
                <span className="text-xl">🛡️</span>
                <span className="text-xs md:text-base font-medium">Alarmas</span>
              </Link>
              
              <div className="md:mt-auto">
                 <form action={async () => {
                   'use server';
                   const { cookies } = await import('next/headers');
                   (await cookies()).delete('userId');
                   const { redirect } = await import('next/navigation');
                   redirect('/login');
                 }}>
                   <button type="submit" className="flex flex-col md:flex-row items-center gap-1 md:gap-3 text-slate-400 hover:text-white transition-colors w-full md:text-left">
                     <span className="text-xl md:hidden">🚪</span>
                     <span className="text-[10px] md:text-sm font-medium">Salir</span>
                   </button>
                 </form>
              </div>
            </div>
          </nav>
        )}
        <main className={`min-h-screen ${userId ? 'md:ml-64 print:m-0' : ''}`}>
          {children}
        </main>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
