import { supabase } from '@/lib/supabase'

// Utility functions for image upload to Supabase Storage
export const STORAGE_BUCKET = 'pin-photos'

/**
 * Ensure the storage bucket exists
 * This function will be called before uploading to make sure the bucket is available
 */
async function ensureBucketExists(): Promise<void> {
  try {
    // First, try to list files in the bucket (this will fail if bucket doesn't exist)
    const { error: listError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list('', { limit: 1 })
    
    if (listError && listError.message.includes('The resource was not found')) {
      console.log('Storage bucket does not exist, it needs to be created manually in Supabase dashboard')
      throw new Error('Storage bucket "pin-photos" does not exist. Please create it in your Supabase dashboard under Storage > Buckets. Make it public and allow image uploads.')
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('pin-photos')) {
      throw error // Re-throw our custom error message
    }
    // For other errors, assume bucket exists and let the upload attempt proceed
    console.warn('Could not verify bucket existence:', error)
  }
}

export interface UploadResult {
  url?: string
  error?: string
}

/**
 * Convert a base64 data URL string into a File without making any network requests.
 * This avoids using fetch("data:...") which can violate strict CSP connect-src rules.
 */
export function dataUrlToFile(dataUrl: string, suggestedFileName: string): File {
  // Expected format: data:<mime>;base64,<payload>
  const match = dataUrl.match(/^data:([^;]+);base64,(.*)$/)
  if (!match) {
    // Fallback: create an empty file with generic type
    return new File([new Uint8Array()], suggestedFileName || 'image.webp', {
      type: 'application/octet-stream',
      lastModified: Date.now(),
    })
  }
  const mime = match[1]
  const b64 = match[2]

  const binaryString = atob(b64)
  const len = binaryString.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }

  // Ensure the filename has an extension matching mime when possible
  const ext = mime.includes('png')
    ? 'png'
    : mime.includes('webp')
    ? 'webp'
    : mime.includes('jpeg') || mime.includes('jpg')
    ? 'jpg'
    : 'webp'

  const finalName = /\.[a-zA-Z0-9]+$/.test(suggestedFileName)
    ? suggestedFileName
    : `${suggestedFileName}.${ext}`

  return new File([bytes], finalName, { type: mime, lastModified: Date.now() })
}

/**
 * Upload a single image file to Supabase Storage
 * @param file - The File object to upload
 * @param path - The storage path (e.g., 'pins/pin-id/0.webp')
 * @returns Promise with upload result containing URL or error
 */
export async function uploadImageToStorage(file: File, path: string): Promise<UploadResult> {
  try {
    // Ensure bucket exists before attempting upload (non-fatal)
    await ensureBucketExists()
    
    // Convert file to WebP format for better compression (optional)
    const processedFile = await optimizeImage(file)
    console.log('[imageUpload] Uploading to storage via signed URL', {
      path,
      original: { name: file.name, type: file.type, size: file.size },
      processed: { name: processedFile.name, type: processedFile.type, size: processedFile.size }
    })

    // Request a signed upload URL token from server
    const signedResp = await fetch('/api/storage/signed-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paths: [{ path }] })
    })
    if (!signedResp.ok) {
      const err = await signedResp.json().catch(() => ({}))
      console.error('[imageUpload] Failed to get signed URL:', err)
      return { error: 'Failed to get signed URL' }
    }
    const { uploads } = await signedResp.json()
    const token: string | undefined = uploads?.[0]?.token
    if (!token) return { error: 'Missing upload token' }

    // Use the Supabase JS client to upload with signed token
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .uploadToSignedUrl(path, token, processedFile, {
        contentType: 'image/webp',
        upsert: true,
        cacheControl: '2592000'
      } as any)

    if (error) {
      console.error('[imageUpload] Upload error:', error)
      return { error: error.message }
    }

    // Build public URL
    const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)
    if (!urlData?.publicUrl) return { error: 'Failed to get public URL' }
    return { url: urlData.publicUrl }

  } catch (error) {
    console.error('[imageUpload] Image upload error:', error)
    return { error: error instanceof Error ? error.message : 'Unknown error occurred' }
  }
}

/**
 * Upload multiple images to Supabase Storage
 * @param files - Array of File objects to upload
 * @param basePathPrefix - Base path prefix (e.g., 'pins/pin-id')
 * @returns Promise with array of upload results
 */
export async function uploadMultipleImages(
  files: File[],
  basePathPrefix: string
): Promise<UploadResult[]> {
  const uploadPromises = files.map((file, index) => {
    const path = `${basePathPrefix}/${index}.webp`
    return uploadImageToStorage(file, path)
  })

  return Promise.all(uploadPromises)
}

/**
 * Optimize image file - convert to WebP format with compression
 * Falls back to original file if optimization fails
 * @param file - Original image file
 * @returns Optimized file or original file
 */
async function optimizeImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    // Create canvas for image processing
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      try {
        // Calculate optimal dimensions (max 1200px on longest side)
        const maxSize = 1200
        let { width, height } = img
        
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height * maxSize) / width
            width = maxSize
          } else {
            width = (width * maxSize) / height
            height = maxSize
          }
        }

        canvas.width = width
        canvas.height = height

        // Draw and compress image
        ctx?.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const optimizedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.webp'), {
                type: 'image/webp',
                lastModified: Date.now()
              })
              resolve(optimizedFile)
            } else {
              resolve(file) // Fallback to original
            }
          },
          'image/webp',
          0.8 // Quality 80%
        )
      } catch (error) {
        console.warn('Image optimization failed, using original:', error)
        resolve(file)
      }
    }

    img.onerror = () => {
      console.warn('Failed to load image for optimization, using original')
      resolve(file)
    }

    img.src = URL.createObjectURL(file)
  })
}

/**
 * Generate unique path for pin image
 * @param pinId - Pin ID
 * @param imageIndex - Image index
 * @returns Storage path string
 */
export function generatePinImagePath(pinId: string, imageIndex: number): string {
  return `pins/${pinId}/${imageIndex}.webp`
}

/**
 * Generate unique path for temporary pin image (during creation)
 * @param tempId - Temporary ID (could be timestamp or uuid)
 * @param imageIndex - Image index
 * @returns Storage path string
 */
export function generateTempPinImagePath(tempId: string, imageIndex: number): string {
  return `temp/${tempId}/${imageIndex}.webp`
}

/**
 * Delete image from storage
 * @param path - Storage path to delete
 * @returns Promise with success status
 */
export async function deleteImageFromStorage(path: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([path])

    if (error) {
      console.error('Delete error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Image deletion error:', error)
    return false
  }
}