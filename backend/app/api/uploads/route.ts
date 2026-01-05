/**
 * Uploads API - Cloudinary Proxy con Anti-Bot y Rate Limiting
 * POST /api/uploads
 * 
 * Protecciones:
 * 1. Rate limiting (10 uploads / 5 min por IP)
 * 2. Validación de tipos MIME (solo imágenes)
 * 3. Honeypot anti-bot
 * 4. Validación aspect ratio (solo horizontales: 16:9, 4:3)
 * 5. Máximo 5 imágenes por request
 */

import { NextRequest, NextResponse } from 'next/server';
import { rateLimiter } from '@/infrastructure/rate-limiter';
import { uploadToCloudinary } from '@/infrastructure/cloudinary.service';
import { validateImageAspectRatio } from '@/domain/images/service';
import sharp from 'sharp';

// Tipos MIME permitidos (SOLO IMÁGENES)
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic', // iOS photos
  'image/heif', // iOS photos
];

// Tipos bloqueados explícitamente
const BLOCKED_PATTERNS = [
  'video/',
  'audio/',
  'application/',
];

/**
 * Obtener IP del cliente (considerando proxies)
 */
function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

/**
 * Validar tipo MIME del archivo
 */
function validateMimeType(mimeType: string): { valid: boolean; reason?: string } {
  // Verificar si es un tipo bloqueado
  for (const pattern of BLOCKED_PATTERNS) {
    if (mimeType.startsWith(pattern)) {
      return {
        valid: false,
        reason: `Tipo de archivo no permitido: ${mimeType}. Solo se permiten imágenes.`
      };
    }
  }

  // Verificar si está en la lista permitida
  if (!ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase())) {
    return {
      valid: false,
      reason: `Formato de imagen no soportado: ${mimeType}. Formatos permitidos: JPG, PNG, WebP, HEIC`
    };
  }

  return { valid: true };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // 1. RATE LIMITING por IP
    const clientIP = getClientIP(request);
    const rateLimitCheck = rateLimiter.check(clientIP);

    if (!rateLimitCheck.allowed) {
      console.warn(`[RATE LIMIT] IP: ${clientIP} - ${rateLimitCheck.reason}`);
      
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: rateLimitCheck.reason,
          resetAt: new Date(rateLimitCheck.resetAt).toISOString()
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitCheck.resetAt.toString()
          }
        }
      );
    }

    // 2. HONEYPOT CHECK (campo invisible que los bots llenan)
    const formData = await request.formData();
    const honeypot = formData.get('website') || formData.get('url') || formData.get('homepage');
    
    if (honeypot && typeof honeypot === 'string' && honeypot.trim() !== '') {
      console.warn(`[BOT DETECTED] IP: ${clientIP} - Honeypot filled: "${honeypot}"`);
      
      // No revelar que es honeypot, dar error genérico
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      );
    }

    // 3. VALIDAR ARCHIVO
    const file = formData.get('file') as File;
    const folder = (formData.get('folder') as string) || 'ads';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // 4. VALIDAR TIPO MIME
    const mimeValidation = validateMimeType(file.type);
    if (!mimeValidation.valid) {
      console.warn(`[INVALID MIME] IP: ${clientIP} - Type: ${file.type}`);
      
      return NextResponse.json(
        { error: mimeValidation.reason },
        { status: 400 }
      );
    }

    // 5. VALIDAR TAMAÑO (máx 10MB - Cloudinary lo rechazará si es muy grande)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `Archivo muy grande. Máximo: 10MB. Tu archivo: ${(file.size / 1024 / 1024).toFixed(2)}MB` },
        { status: 400 }
      );
    }

    // 6. CONVERTIR A BUFFER
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 7. VALIDAR ASPECT RATIO (solo horizontales)
    try {
      const metadata = await sharp(buffer).metadata();
      const { width = 0, height = 0 } = metadata;

      const aspectValidation = validateImageAspectRatio(width, height, {
        min: 1.2,  // 6:5 mínimo (casi cuadrado)
        max: 2.5   // 21:9 máximo (ultra wide)
      });

      if (!aspectValidation.valid) {
        console.warn(`[INVALID ASPECT] IP: ${clientIP} - Ratio: ${aspectValidation.ratio.toFixed(2)}:1`);
        
        return NextResponse.json(
          { 
            error: aspectValidation.reason,
            ratio: aspectValidation.ratio.toFixed(2),
            dimensions: { width, height }
          },
          { status: 400 }
        );
      }

      console.log(`[VALID ASPECT] ${width}x${height} - Ratio: ${aspectValidation.ratio.toFixed(2)}:1`);
    } catch (sharpError: any) {
      console.error(`[SHARP ERROR] Failed to process image:`, sharpError);
      return NextResponse.json(
        { error: 'Failed to process image', details: sharpError.message },
        { status: 400 }
      );
    }

    // 8. UPLOAD A CLOUDINARY
    const result = await uploadToCloudinary(buffer, folder);

    // 9. REGISTRAR UPLOAD EXITOSO (para rate limiting)
    rateLimiter.record(clientIP);

    const duration = Date.now() - startTime;
    console.log(`[SUCCESS] Upload completed in ${duration}ms - URL: ${result.url}`);

    return NextResponse.json({
      url: result.url,
      path: result.path,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes
    }, {
      headers: {
        'X-RateLimit-Remaining': rateLimitCheck.remaining.toString()
      }
    });

  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[ERROR] Upload failed after ${duration}ms:`, error);
    
    return NextResponse.json(
      { 
        error: 'Upload failed', 
        details: error.message || 'Unknown error',
        code: error.http_code || 500
      },
      { status: error.http_code || 500 }
    );
  }
}
