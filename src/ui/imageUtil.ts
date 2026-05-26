const GLYPH_SIZE = 96;

/**
 * Read an image file and produce a small square transparent PNG data URL,
 * fitting the image inside GLYPH_SIZE (contain). Keeps localStorage small.
 */
export function fileToGlyph(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read failed'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('decode failed'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = GLYPH_SIZE;
        canvas.height = GLYPH_SIZE;
        const ctx = canvas.getContext('2d')!;
        const scale = Math.min(GLYPH_SIZE / img.width, GLYPH_SIZE / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (GLYPH_SIZE - w) / 2, (GLYPH_SIZE - h) / 2, w, h);
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export const GLYPH_PX = GLYPH_SIZE;
