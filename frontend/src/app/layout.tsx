export const metadata = { title: "QuoteWars", description: "Quote battle arena on GenLayer" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#0a0a0a", color: "#e0e0e0" }}>{children}</body></html>);
}
