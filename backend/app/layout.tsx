export const metadata = {
  title: 'Rural24 BFF API',
  description: 'Backend for Frontend - Next.js 16',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
