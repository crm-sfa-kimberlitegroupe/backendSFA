import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  v2 as cloudinary,
  UploadApiResponse,
  UploadApiErrorResponse,
} from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor(private configService: ConfigService) {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    console.log('🔧 Cloudinary Configuration:', {
      cloudName: cloudName ? '✓ Set' : '✗ Missing',
      apiKey: apiKey ? '✓ Set' : '✗ Missing',
      apiSecret: apiSecret ? '✓ Set' : '✗ Missing',
    });

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
  }

  /**
   * Upload une image vers Cloudinary
   * @param file - Le fichier à uploader (buffer ou stream)
   * @param folder - Le dossier dans Cloudinary
   * @returns L'URL sécurisée de l'image uploadée
   */
  async uploadImage(
    file: Express.Multer.File,
    folder?: string,
  ): Promise<string> {
    console.log('📤 Starting upload to Cloudinary:', {
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
    });

    return new Promise((resolve, reject) => {
      const uploadFolder =
        folder ||
        this.configService.get<string>('CLOUDINARY_FOLDER', 'sfa-profiles');

      console.log('📁 Upload folder:', uploadFolder);

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: uploadFolder,
          resource_type: 'image',
          transformation: [
            { width: 500, height: 500, crop: 'fill', gravity: 'face' },
            { quality: 'auto', fetch_format: 'auto' },
          ],
        },
        (
          error: UploadApiErrorResponse | undefined,
          result: UploadApiResponse | undefined,
        ) => {
          if (error) {
            console.error('❌ Cloudinary upload error:', error);
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            reject(error);
          } else if (result) {
            console.log('✅ Upload successful:', result.secure_url);
            resolve(result.secure_url);
          } else {
            console.error('❌ Upload failed without error');
            reject(new Error('Upload failed without error'));
          }
        },
      );

      uploadStream.end(file.buffer);
    });
  }

  /**
   * Supprime une image de Cloudinary
   * @param publicId - L'ID public de l'image à supprimer
   */
  async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error('Error deleting image from Cloudinary:', error);
      throw error;
    }
  }

  /**
   * Extrait le public_id d'une URL Cloudinary
   * @param url - L'URL Cloudinary
   * @returns Le public_id
   */
  extractPublicId(url: string): string | null {
    try {
      const matches = url.match(/\/v\d+\/(.+)\.\w+$/);
      return matches ? matches[1] : null;
    } catch {
      return null;
    }
  }
}
