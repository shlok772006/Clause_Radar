import { describe, it, expect } from 'vitest';
import { parsePdf, PdfProcessingError } from './pdf';

describe('parsePdf validation', () => {
  it('throws not_pdf if magic bytes are not %PDF', async () => {
    const invalidBuffer = new TextEncoder().encode('Hello World').buffer;
    await expect(parsePdf(invalidBuffer)).rejects.toThrow(PdfProcessingError);
    try {
      await parsePdf(invalidBuffer);
    } catch (err) {
      expect(err).toBeInstanceOf(PdfProcessingError);
      expect((err as PdfProcessingError).error.type).toBe('not_pdf');
    }
  });

  it('throws too_large if buffer exceeds 15MB', async () => {
    // We don't allocate full 16MB real data, just a buffer with magic bytes
    const largeBuffer = new ArrayBuffer(16 * 1024 * 1024);
    const view = new Uint8Array(largeBuffer);
    view[0] = 0x25; // %
    view[1] = 0x50; // P
    view[2] = 0x44; // D
    view[3] = 0x46; // F

    await expect(parsePdf(largeBuffer)).rejects.toThrow(PdfProcessingError);
    try {
      await parsePdf(largeBuffer);
    } catch (err) {
      expect(err).toBeInstanceOf(PdfProcessingError);
      expect((err as PdfProcessingError).error.type).toBe('too_large');
    }
  });

  it('throws not_pdf if buffer is smaller than 4 bytes', async () => {
    const tinyBuffer = new Uint8Array([0x25, 0x50]).buffer;
    try {
      await parsePdf(tinyBuffer);
    } catch (err) {
      expect(err).toBeInstanceOf(PdfProcessingError);
      expect((err as PdfProcessingError).error.type).toBe('not_pdf');
    }
  });
});
