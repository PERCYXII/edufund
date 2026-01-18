/**
 * Utility functions for robust form submission on mobile
 * - Retry mechanism for failed network operations
 * - Image compression before upload
 * - Timeout handling with descriptive errors
 */

/**
 * Compress an image file using Canvas API
 * @param file - The image file to compress
 * @param maxWidth - Maximum width (default 1200px)
 * @param quality - JPEG quality 0-1 (default 0.7)
 * @returns Compressed file or original if not an image/compression fails
 */
export async function compressImage(
    file: File,
    maxWidth: number = 1200,
    quality: number = 0.7
): Promise<File> {
    // Only compress images
    if (!file.type.startsWith('image/')) {
        console.log('Not an image, skipping compression:', file.type);
        return file;
    }

    // Skip if already small (under 500KB)
    if (file.size < 500 * 1024) {
        console.log('Image already small, skipping compression:', file.size);
        return file;
    }

    return new Promise((resolve) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        img.onload = () => {
            try {
                // Calculate new dimensions
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                // Draw and compress
                ctx?.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob && blob.size < file.size) {
                            // Compression successful and smaller
                            const compressedFile = new File([blob], file.name, {
                                type: 'image/jpeg',
                                lastModified: Date.now(),
                            });
                            console.log(
                                `Compressed ${file.name}: ${(file.size / 1024).toFixed(0)}KB → ${(compressedFile.size / 1024).toFixed(0)}KB`
                            );
                            resolve(compressedFile);
                        } else {
                            // Compression didn't help, use original
                            console.log('Compression did not reduce size, using original');
                            resolve(file);
                        }
                    },
                    'image/jpeg',
                    quality
                );
            } catch (err) {
                console.warn('Image compression failed, using original:', err);
                resolve(file);
            }
        };

        img.onerror = () => {
            console.warn('Failed to load image for compression, using original');
            resolve(file);
        };

        // Load image from file
        img.src = URL.createObjectURL(file);
    });
}

/**
 * Execute a promise with timeout
 * @param promise - The promise to execute
 * @param ms - Timeout in milliseconds
 * @param operationName - Name for error messages
 */
export async function withTimeout<T>(
    promise: PromiseLike<T> | Promise<T>,
    ms: number = 45000,
    operationName: string = 'Operation'
): Promise<T> {
    return Promise.race([
        Promise.resolve(promise),
        new Promise<T>((_, reject) =>
            setTimeout(
                () => reject(new Error(`${operationName} timed out after ${ms / 1000}s. Please check your internet connection.`)),
                ms
            )
        ),
    ]);
}

/**
 * Execute a function with automatic retry on failure
 * @param fn - Async function to execute
 * @param options - Retry configuration
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    options: {
        maxAttempts?: number;
        delayMs?: number;
        backoffMultiplier?: number;
        onRetry?: (attempt: number, error: Error) => void;
        operationName?: string;
    } = {}
): Promise<T> {
    const {
        maxAttempts = 3,
        delayMs = 1500,
        backoffMultiplier = 1.5,
        onRetry,
        operationName = 'Operation',
    } = options;

    let lastError: Error = new Error('Unknown error');
    let currentDelay = delayMs;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (error: any) {
            lastError = error;
            
            // Don't retry on certain errors
            const message = error?.message?.toLowerCase() || '';
            const isUnretryable = 
                message.includes('unauthorized') ||
                message.includes('forbidden') ||
                message.includes('not found') ||
                message.includes('validation') ||
                message.includes('invalid');

            if (isUnretryable || attempt === maxAttempts) {
                throw error;
            }

            console.warn(`${operationName} failed (attempt ${attempt}/${maxAttempts}):`, error.message);
            
            if (onRetry) {
                onRetry(attempt, error);
            }

            // Wait before retry with exponential backoff
            await new Promise((r) => setTimeout(r, currentDelay));
            currentDelay *= backoffMultiplier;
        }
    }

    throw lastError;
}

/**
 * Combined: Execute with both timeout and retry
 * @param fn - Async function to execute
 * @param options - Configuration options
 */
export async function withRetryAndTimeout<T>(
    fn: () => Promise<T>,
    options: {
        timeoutMs?: number;
        maxAttempts?: number;
        delayMs?: number;
        operationName?: string;
        onRetry?: (attempt: number, error: Error) => void;
    } = {}
): Promise<T> {
    const {
        timeoutMs = 60000,
        maxAttempts = 3,
        delayMs = 2000,
        operationName = 'Operation',
        onRetry,
    } = options;

    return withRetry(
        async () => {
            return withTimeout(fn(), timeoutMs, operationName);
        },
        {
            maxAttempts,
            delayMs,
            operationName,
            onRetry,
        }
    );
}
