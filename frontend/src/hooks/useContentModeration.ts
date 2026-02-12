/**
 * useContentModeration Hook
 * Moderación de contenido con NSFW.js (TensorFlow Lite)
 * 
 * Características:
 * - Análisis 100% local (privacidad)
 * - Detección de contenido NSFW
 * - Sin servidor, sin costos
 * - ~200ms de análisis por imagen
 * 
 * Fecha: 12 Febrero 2026
 */

import { useState, useCallback, useRef, useEffect } from 'react';

// Dynamic import para evitar crash de esbuild con TensorFlow
type NSFWJSModule = typeof import('nsfwjs');
type NSFWJSModel = Awaited<ReturnType<NSFWJSModule['load']>>;
type PredictionType = { className: string; probability: number };

// Umbrales de confianza (0-1)
const THRESHOLDS = {
  PORN: {
    block: 0.70,  // >70% porn → bloquear
    warn: 0.50,   // >50% porn → advertir
  },
  SEXY: {
    block: 0.85,  // >85% sexy → bloquear
    warn: 0.60,   // >60% sexy → advertir
  },
  HENTAI: {
    block: 0.70,  // >70% hentai → bloquear
    warn: 0.50,   // >50% hentai → advertir
  },
} as const;

export interface ModerationResult {
  isApproved: boolean;
  shouldWarn: boolean;
  scores: {
    porn: number;
    sexy: number;
    hentai: number;
    neutral: number;
    drawing: number;
  };
  blockReason?: string;
  warnReason?: string;
}

export interface ModerationOptions {
  skipCheck?: boolean;  // Para testing
  logResults?: boolean; // Log en consola (dev)
}

/**
 * Hook para moderación de contenido
 */
export function useContentModeration() {
  const [isLoading, setIsLoading] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const modelRef = useRef<NSFWJSModel | null>(null);

  // Cargar modelo al montar
  useEffect(() => {
    let mounted = true;

    const loadModel = async () => {
      try {
        console.log('[ContentModeration] 📦 Cargando modelo NSFW.js...');
        
        // Dynamic import para evitar crash en build
        const nsfwjs = await import('nsfwjs');
        const model = await nsfwjs.load();
        
        if (mounted) {
          modelRef.current = model;
          setIsModelLoaded(true);
          console.log('[ContentModeration] ✅ Modelo cargado');
        }
      } catch (error) {
        console.error('[ContentModeration] ❌ Error cargando modelo:', error);
        // No bloquear la app si falla - continuar sin moderación
      }
    };

    loadModel();

    return () => {
      mounted = false;
    };
  }, []);

  /**
   * Analizar imagen
   */
  const analyzeImage = useCallback(async (
    file: File,
    options: ModerationOptions = {}
  ): Promise<ModerationResult> => {
    const { skipCheck = false, logResults = true } = options;

    // Si no hay modelo o se saltea check, aprobar
    if (!modelRef.current || skipCheck) {
      return {
        isApproved: true,
        shouldWarn: false,
        scores: { porn: 0, sexy: 0, hentai: 0, neutral: 1, drawing: 0 },
      };
    }

    setIsLoading(true);

    try {
      // Crear elemento de imagen para análisis
      const img = document.createElement('img');
      const objectUrl = URL.createObjectURL(file);

      const predictions = await new Promise<PredictionType[]>((resolve, reject) => {
        img.onload = async () => {
          try {
            const result = await modelRef.current!.classify(img);
            URL.revokeObjectURL(objectUrl);
            resolve(result);
          } catch (err) {
            reject(err);
          }
        };
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          reject(new Error('Error cargando imagen'));
        };
        img.src = objectUrl;
      });

      // Convertir array a objeto de scores
      const scores = predictions.reduce((acc, pred) => {
        acc[pred.className.toLowerCase()] = pred.probability;
        return acc;
      }, {} as Record<string, number>);

      const result: ModerationResult = {
        isApproved: true,
        shouldWarn: false,
        scores: {
          porn: scores.porn || 0,
          sexy: scores.sexy || 0,
          hentai: scores.hentai || 0,
          neutral: scores.neutral || 0,
          drawing: scores.drawing || 0,
        },
      };

      // Evaluar si debe bloquearse
      if (scores.porn >= THRESHOLDS.PORN.block) {
        result.isApproved = false;
        result.blockReason = 'Contenido adulto detectado';
      } else if (scores.hentai >= THRESHOLDS.HENTAI.block) {
        result.isApproved = false;
        result.blockReason = 'Contenido adulto detectado';
      } else if (scores.sexy >= THRESHOLDS.SEXY.block) {
        result.isApproved = false;
        result.blockReason = 'Contenido inapropiado detectado';
      }
      // Evaluar si debe advertirse
      else if (scores.porn >= THRESHOLDS.PORN.warn) {
        result.shouldWarn = true;
        result.warnReason = 'Contenido que puede ser inapropiado';
      } else if (scores.sexy >= THRESHOLDS.SEXY.warn) {
        result.shouldWarn = true;
        result.warnReason = 'Contenido que puede ser inapropiado';
      } else if (scores.hentai >= THRESHOLDS.HENTAI.warn) {
        result.shouldWarn = true;
        result.warnReason = 'Contenido que puede ser inapropiado';
      }

      // Log en desarrollo
      if (logResults && process.env.NODE_ENV === 'development') {
        console.log(`[ContentModeration] 🔍 Análisis:`, {
          file: file.name,
          approved: result.isApproved,
          warn: result.shouldWarn,
          scores: {
            porn: `${(scores.porn * 100).toFixed(1)}%`,
            sexy: `${(scores.sexy * 100).toFixed(1)}%`,
            hentai: `${(scores.hentai * 100).toFixed(1)}%`,
            neutral: `${(scores.neutral * 100).toFixed(1)}%`,
          },
          reason: result.blockReason || result.warnReason || 'OK',
        });
      }

      return result;
    } catch (error) {
      console.error('[ContentModeration] ❌ Error analizando:', error);
      
      // En caso de error, aprobar (fail-open)
      // Mejor dejar pasar contenido que bloquear usuarios legítimos
      return {
        isApproved: true,
        shouldWarn: false,
        scores: { porn: 0, sexy: 0, hentai: 0, neutral: 1, drawing: 0 },
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Analizar múltiples imágenes
   */
  const analyzeMultiple = useCallback(async (
    files: File[],
    options?: ModerationOptions
  ): Promise<Map<string, ModerationResult>> => {
    const results = new Map<string, ModerationResult>();

    for (const file of files) {
      const result = await analyzeImage(file, options);
      results.set(file.name, result);
    }

    return results;
  }, [analyzeImage]);

  return {
    analyzeImage,
    analyzeMultiple,
    isLoading,
    isModelLoaded,
  };
}
