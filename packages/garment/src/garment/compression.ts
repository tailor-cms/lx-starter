// Import zlib for zstd functions (not yet in @types/node)
import * as zlib from 'node:zlib';

/**
 * Compress JSON string using zstd algorithm
 * @param json - JSON string to compress
 * @returns Compressed buffer
 */
export function compressJSON(json: string): Buffer {
  const buffer = Buffer.from(json, 'utf-8');
  // Use zstd compression (dynamic access until @types/node is updated)
  return (zlib as any).zstdCompressSync(buffer);
}

/**
 * Decompress buffer and parse JSON
 * Auto-detects zstd compression from magic bytes
 * @param buffer - Compressed buffer or plain JSON string/buffer
 * @returns Parsed JSON object
 */
export function decompressJSON(buffer: Buffer | string): any {
  // Handle string input (uncompressed JSON)
  if (typeof buffer === 'string') {
    return JSON.parse(buffer);
  }

  // Auto-detect zstd compression from magic bytes
  const isZstd = isZstdCompressed(buffer);

  let jsonString: string;

  if (isZstd) {
    // Use zstd decompression (dynamic access until @types/node is updated)
    jsonString = (zlib as any).zstdDecompressSync(buffer).toString('utf-8');
  } else {
    // Plain JSON
    jsonString = buffer.toString('utf-8');
  }

  return JSON.parse(jsonString);
}

/**
 * Detect if buffer is zstd compressed using magic bytes
 * @param buffer - Buffer to inspect
 * @returns true if zstd compressed, false otherwise
 */
function isZstdCompressed(buffer: Buffer): boolean {
  if (buffer.length < 4) {
    return false;
  }

  // Zstd magic number: 0x28, 0xB5, 0x2F, 0xFD
  return buffer[0] === 0x28
    && buffer[1] === 0xB5
    && buffer[2] === 0x2F
    && buffer[3] === 0xFD;
}
