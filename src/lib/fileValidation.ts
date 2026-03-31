// src/lib/fileValidation.ts
// Issue #51: Secure file upload validation

export interface FileValidationConfig {
  maxSizeBytes: number;
  allowedTypes: string[];
  allowedExtensions: string[];
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

// Common file validation configurations
export const FILE_CONFIGS = {
  AVATAR: {
    maxSizeBytes: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
  },
  POST_IMAGE: {
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
  },
  DOCUMENT: {
    maxSizeBytes: 20 * 1024 * 1024, // 20MB
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    allowedExtensions: ['.pdf', '.doc', '.docx'],
  },
};

/**
 * Validate a file before upload
 */
export const validateFile = (
  file: File,
  config: FileValidationConfig
): FileValidationResult => {
  // Check file size
  if (file.size > config.maxSizeBytes) {
    const maxSizeMB = (config.maxSizeBytes / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`,
    };
  }

  // Check file type
  if (!config.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed. Allowed types: ${config.allowedTypes.join(', ')}`,
    };
  }

  // Check file extension
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!config.allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `File extension ${extension} is not allowed. Allowed extensions: ${config.allowedExtensions.join(', ')}`,
    };
  }

  // Additional security checks
  // Check for null bytes in filename (potential path traversal)
  if (file.name.includes('\0')) {
    return {
      valid: false,
      error: 'Invalid filename',
    };
  }

  // Check for path traversal attempts
  if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
    return {
      valid: false,
      error: 'Invalid filename',
    };
  }

  return { valid: true };
};

/**
 * Validate multiple files
 */
export const validateFiles = (
  files: File[],
  config: FileValidationConfig
): FileValidationResult => {
  for (const file of files) {
    const result = validateFile(file, config);
    if (!result.valid) {
      return result;
    }
  }
  return { valid: true };
};

/**
 * Get human-readable file size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Check if file is an image
 */
export const isImage = (file: File): boolean => {
  return file.type.startsWith('image/');
};

/**
 * Create a safe filename
 */
export const sanitizeFilename = (filename: string): string => {
  // Remove path components
  const basename = filename.split(/[/\\]/).pop() || 'file';
  
  // Remove special characters except dots, dashes, and underscores
  const sanitized = basename.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  // Limit length
  const maxLength = 255;
  if (sanitized.length > maxLength) {
    const ext = sanitized.split('.').pop();
    const name = sanitized.substring(0, maxLength - (ext?.length || 0) - 1);
    return ext ? `${name}.${ext}` : name;
  }
  
  return sanitized;
};

/**
 * Validate image dimensions
 */
export const validateImageDimensions = (
  file: File,
  maxWidth: number,
  maxHeight: number
): Promise<FileValidationResult> => {
  return new Promise((resolve) => {
    if (!isImage(file)) {
      resolve({ valid: false, error: 'File is not an image' });
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      if (img.width > maxWidth || img.height > maxHeight) {
        resolve({
          valid: false,
          error: `Image dimensions ${img.width}x${img.height} exceed maximum ${maxWidth}x${maxHeight}`,
        });
      } else {
        resolve({ valid: true });
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ valid: false, error: 'Failed to load image' });
    };

    img.src = url;
  });
};
