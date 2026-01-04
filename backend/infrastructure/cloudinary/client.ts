/**
 * Cloudinary Client
 * Cliente para almacenamiento y transformación de imágenes
 */

import { v2 as cloudinary } from 'cloudinary';

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

// Configurar Cloudinary (se ejecuta una sola vez)
let isConfigured = false;

export function getCloudinaryClient() {
  if (!isConfigured) {
    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error(
        'Missing Cloudinary credentials. Check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env.local'
      );
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    isConfigured = true;
  }

  return cloudinary;
}

export function getCloudinaryConfig() {
  if (!cloudName) {
    throw new Error('Missing CLOUDINARY_CLOUD_NAME in .env.local');
  }

  return {
    cloudName,
  };
}
