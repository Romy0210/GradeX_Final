import { supabase } from './config';

/**
 * Uploads a profile photo to Supabase Storage and returns the public URL.
 * @param userId - The user's UID (used as the filename).
 * @param file - The image file to upload.
 * @param bucket - The storage bucket name (default is 'avatars').
 * @returns The public URL of the uploaded photo.
 */
export async function uploadProfilePhoto(userId: string, file: File, bucket: string = 'avatars'): Promise<string> {
  // 1. Upload the file
  // We use the userId as the filename to overwrite any existing photo for that user.
  // We also append a timestamp or use a unique path if we want to avoid caching issues, 
  // but for profile photos, usually a fixed path is fine if the browser handles it.
  // Actually, appending a short hash or timestamp is better to avoid stale cache.
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `public/${fileName}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) {
    throw new Error(`Supabase upload error: ${error.message}`);
  }

  // 2. Get the public URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return publicUrl;
}
