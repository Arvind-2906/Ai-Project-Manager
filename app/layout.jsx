import "./globals.css";

export const metadata = {
  title: "AI Project Manager | Autonomous Engineering Platform",
  description:
    "Enterprise-grade, AI-native project management platform powered by LangGraph, Gemini, and human-in-the-loop governance.",
  keywords: [
    "AI Project Management",
    "LangGraph",
    "Gemini",
    "Agentic Workflow",
    "Software Engineering",
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background font-sans text-foreground">
        {children}
      </body>
    </html>
  );
}
