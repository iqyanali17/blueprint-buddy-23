/**
 * Compresses and resizes an image file in the browser using HTML5 Canvas.
 * Keeps aspect ratio, caps max dimension (default 1280px), and compresses to WebP or JPEG.
 * Returns a compact base64 data URL, dimensions, and estimated byte size.
 */
export async function optimizeImage(
  file: File,
  maxDimension = 1280,
  quality = 0.8
): Promise<{ dataUrl: string; width: number; height: number; size: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({
            dataUrl: e.target?.result as string,
            width: img.width,
            height: img.height,
            size: file.size,
          });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Attempt WebP compression, fall back to JPEG if unsupported
        let dataUrl = canvas.toDataURL('image/webp', quality);
        if (!dataUrl.startsWith('data:image/webp')) {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        // Estimate byte size from base64 string
        const size = Math.round((dataUrl.length * 3) / 4);
        resolve({ dataUrl, width, height, size });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
