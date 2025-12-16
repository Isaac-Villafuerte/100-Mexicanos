import imageCompression from 'browser-image-compression';

const defaultOptions = {
  maxSizeMB: 0.4,
  maxWidthOrHeight: 600,
  useWebWorker: true,
};

/**
 * Compress an image file
 * @param {File} file - The image file to compress
 * @param {Object} options - Compression options (browser-image-compression options)
 * @returns {Promise<File>} - Compressed image file
 */
export async function compressImage(file, options = {}) {
  const compressionOptions = { ...defaultOptions, ...options };
  
  try {
    const compressedFile = await imageCompression(file, compressionOptions);
    console.log(`[ImageCompression] Original: ${(file.size / 1024).toFixed(2)}KB -> Compressed: ${(compressedFile.size / 1024).toFixed(2)}KB`);
    return compressedFile;
  } catch (error) {
    console.error('[ImageCompression] Error:', error);
    throw error;
  }
}

/**
 * Convert a File to base64 data URL
 * @param {File} file - The file to convert
 * @returns {Promise<string>} - Base64 data URL
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
