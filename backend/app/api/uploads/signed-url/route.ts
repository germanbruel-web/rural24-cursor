/**
 * API Route - POST /api/uploads/signed-url
 * Genera firma para upload directo a Cloudinary
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCloudinaryClient, getCloudinaryConfig } from '@/infrastructure/cloudinary/client';
import { z } from 'zod';

const SignedUrlRequestSchema = z.object({
  filename: z.string().min(1, 'Filename is required'),
  folder: z.enum(['ads', 'profiles', 'banners']).default('ads'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar request
    const validationResult = SignedUrlRequestSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.reduce((acc, err) => {
        const field = err.path.join('.');
        acc[field] = err.message;
        return acc;
      }, {} as Record<string, string>);

      return NextResponse.json(
        {
          error: 'Validation error',
          message: 'Invalid request data',
          fields: errors,
        },
        { status: 400 }
      );
    }

    const { filename, folder } = validationResult.data;

    // Generar timestamp y public_id único
    const timestamp = Math.round(Date.now() / 1000);
    const publicId = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

    // Obtener cliente y configuración
    const cloudinary = getCloudinaryClient();
    const { cloudName } = getCloudinaryConfig();

    // Parámetros para la firma (deben coincidir EXACTAMENTE con los que se envían a Cloudinary)
    const paramsToSign = {
      timestamp: timestamp,
      folder: folder,
    };

    // Generar firma para upload
    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET!
    );

    // URL de Cloudinary para upload
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

    return NextResponse.json(
      {
        success: true,
        data: {
          uploadUrl,
          cloudName,
          uploadParams: {
            api_key: process.env.CLOUDINARY_API_KEY,
            timestamp,
            signature,
            folder,
          },
          cloudName,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error generating signed upload:', error);

    // Si faltan credenciales, devolver error específico
    if (error.message?.includes('Missing Cloudinary')) {
      return NextResponse.json(
        {
          error: 'Configuration error',
          message: 'Cloudinary not configured. Please contact administrator.',
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to generate upload signature',
      },
      { status: 500 }
    );
  }
}
