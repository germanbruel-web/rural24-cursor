import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  pageName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class PageErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    if (import.meta.env.DEV) {
      console.error(`[PageErrorBoundary] Error en ${this.props.pageName ?? 'página'}:`, error);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Algo salió mal
        </h2>
        <p className="text-gray-500 text-sm mb-8 max-w-sm">
          Ocurrió un error inesperado. Podés reintentar o volver al inicio.
        </p>

        <div className="flex gap-3">
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </button>
          <a
            href="#/"
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors"
          >
            <Home className="w-4 h-4" />
            Inicio
          </a>
        </div>

        {import.meta.env.DEV && this.state.error && (
          <pre className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg text-left text-xs text-red-600 max-w-lg overflow-auto">
            {this.state.error.message}
          </pre>
        )}
      </div>
    );
  }
}
