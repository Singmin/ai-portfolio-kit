import type { ReactNode } from 'react';
// Locale layout owns <html lang> so the server renders the correct language.
export default function RootLayout({ children }: { children: ReactNode }) { return children; }
