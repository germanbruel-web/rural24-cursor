import React from 'react';

/**
 * CardErrorBoundary — boundary lightweight para loops de cards.
 * En error retorna null: la card desaparece silenciosamente
 * sin interrumpir el render de las demás.
 *
 * Uso:
 *   {ads.map(ad => (
 *     <CardErrorBoundary key={ad.id}>
 *       <ProductCard product={ad} />
 *     </CardErrorBoundary>
 *   ))}
 */
export class CardErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    if (import.meta.env.DEV) {
      console.error('[CardErrorBoundary] Card crasheó:', error);
    }
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}
