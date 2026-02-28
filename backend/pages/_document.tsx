/**
 * Custom Document - Pages Router context para generación estática de /404 y /_error
 *
 * Next.js usa el Pages Router engine internamente para generar /404 y /_error
 * incluso en proyectos App Router. Sin este archivo, el renderizado de <Html>
 * ocurre fuera del contexto _document y tira el error:
 * "<Html> should not be imported outside of pages/_document"
 */
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="es">
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
