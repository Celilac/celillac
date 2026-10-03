// frontend/web-app/src/utils/image.ts

export const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
export const MAX_IMAGE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB (suporta fotos de alta resolução tiradas por smartphones)

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Valida o tipo MIME e o tamanho do arquivo de imagem.
 */
export function validateImageFile(file: File): ImageValidationResult {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: 'Formato não suportado. Por favor, envie uma imagem nos formatos PNG, JPG ou WebP.',
    };
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return {
      valid: false,
      error: 'A imagem excede o tamanho máximo permitido de 15 MB.',
    };
  }

  return { valid: true };
}

/**
 * Otimiza e comprime uma imagem utilizando HTML5 Canvas, preservando a proporção original.
 * Redimensiona fotos grandes (ex: tiradas com câmera de celular) mantendo nitidez de rótulos.
 */
export function compressImage(
  file: File,
  maxWidth = 1280,
  maxHeight = 1280,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Não foi possível inicializar o contexto 2D do Canvas.'));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      let dataUrl = canvas.toDataURL('image/webp', quality);
      if (!dataUrl.startsWith('data:image/webp')) {
        dataUrl = canvas.toDataURL('image/jpeg', quality);
      }
      resolve(dataUrl);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Erro ao carregar a imagem selecionada.'));
    };
  });
}
