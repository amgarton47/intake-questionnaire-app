import "./globals.css";

export const metadata = {
  title: "Bioverse Intake System",
  description: "A simple intake questionnaire web app",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
