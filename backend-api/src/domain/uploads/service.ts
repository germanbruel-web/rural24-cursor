/**
 * Upload Service - Gestión de uploads a Cloudinary
 */

import { getCloudinaryClient, getCloudinaryConfig } from '../../infrastructure/cloudinary/client.js';
import { Result } from '../shared/result.js';

interface SignedUploadUrlParams {
  folder?: string;
  public_id?: string;
}

interface SignedUploadUrlResponse {
  uploadUrl: string;
  cloudName: string;
  uploadParams: {
    api_key: string;
    timestamp: number;
    signature: string;
    folder: string;
  };
}

export class UploadService {
  /**
   * Generar URL firmada para upload directo a Cloudinary
   */
  async generateSignedUploadUrl(
    params: SignedUploadUrlParams
  ): Promise<Result<SignedUploadUrlResponse>> {
    try {
      const folder = params.folder || 'rural24/ads';
      const timestamp = Math.round(Date.now() / 1000);

      // Obtener cliente y configuración
      const cloudinary = getCloudinaryClient();
      const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();

      if (!apiSecret || !apiKey) {
        return Result.fail(new Error('Cloudinary credentials not configured'));
      }

      // Parámetros para la firma
      const paramsToSign = {
        timestamp,
        folder,
      };

      // Generar firma
      const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

      // URL de Cloudinary para upload
      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

      return Result.ok({
        uploadUrl,
        cloudName,
        uploadParams: {
          api_key: apiKey,
          timestamp,
          signature,
          folder,
        },
      });
    } catch (error) {
      console.error('❌ Error generating signed upload:', error);
      return Result.fail(error as Error);
    }
  }

  /**
   * Eliminar imagen de Cloudinary
   */
  async deleteImage(publicId: string): Promise<Result<void>> {
    try {
      const cloudinary = getCloudinaryClient();

      await cloudinary.uploader.destroy(publicId);

      return Result.ok(undefined);
    } catch (error) {
      console.error('❌ Error deleting image:', error);
      return Result.fail(error as Error);
    }
  }

  /**
   * Upload directo de imagen desde buffer
   */
  async uploadImageBuffer(
    buffer: Buffer,
    options?: { folder?: string; filename?: string }
  ): Promise<Result<{ url: string; public_id: string }>> {
    try {
      const cloudinary = getCloudinaryClient();
      const folder = options?.folder || 'ads';
      
      // Determinar si usar preset de banners (sin transformaciones)
      const isBanner = folder.includes('banners');
      
      // Carpetas en Cloudinary (plan FREE = Home/ads, Home/banners)
      const targetFolder = isBanner ? 'banners' : 'ads';
      
      console.log(`📦 Upload: folder=${targetFolder}, isBanner=${isBanner}, preset=${isBanner ? 'banners_raw' : 'default'}`);

      return new Promise((resolve) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: targetFolder,
            resource_type: 'image',
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
            max_bytes: 10485760, // 10MB
            // Para banners: usar preset sin transformaciones
            ...(isBanner && { upload_preset: 'banners_raw' }),
          },
          (error, result) => {
            if (error) {
              console.error('❌ Cloudinary upload error:', error);
              resolve(Result.fail(error));
            } else if (result) {
              resolve(
                Result.ok({
                  url: result.secure_url,
                  public_id: result.public_id,
                })
              );
            } else {
              resolve(Result.fail(new Error('Upload failed without error details')));
            }
          }
        );

        uploadStream.end(buffer);
      });
    } catch (error) {
      console.error('❌ Error uploading image:', error);
      return Result.fail(error as Error);
    }
  }
}
