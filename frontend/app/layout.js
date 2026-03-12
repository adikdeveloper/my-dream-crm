import './globals.css';

export const metadata = {
  title: 'CRM Tizimi',
  description: 'Mijozlar boshqaruv tizimi',
};

export default function RootLayout({ children }) {
  return (
    <html lang="uz">
      <body>{children}</body>
    </html>
  );
}
