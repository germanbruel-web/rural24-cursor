import { describe, it, expect } from 'vitest';
import { normalizeImages, getFirstImage } from './imageHelpers';

describe('normalizeImages', () => {
  it('devuelve [] si recibe null o undefined', () => {
    expect(normalizeImages(null)).toEqual([]);
    expect(normalizeImages(undefined)).toEqual([]);
  });

  it('normaliza array de strings (formato legacy)', () => {
    const result = normalizeImages(['foto1.jpg', 'foto2.jpg']);
    expect(result).toHaveLength(2);
    expect(result[0].url).toBe('foto1.jpg');
    expect(result[1].url).toBe('foto2.jpg');
  });

  it('normaliza array de objetos {url}', () => {
    const result = normalizeImages([{ url: 'foto1.jpg' }, { url: 'foto2.jpg' }]);
    expect(result).toHaveLength(2);
    expect(result[0].url).toBe('foto1.jpg');
  });

  it('ordena por sort_order', () => {
    const result = normalizeImages([
      { url: 'segunda.jpg', sort_order: 2 },
      { url: 'primera.jpg', sort_order: 1 },
    ]);
    expect(result[0].url).toBe('primera.jpg');
    expect(result[1].url).toBe('segunda.jpg');
  });

  it('descarta objetos sin url', () => {
    const result = normalizeImages([{ url: 'foto.jpg' }, { url: '' }, null]);
    expect(result).toHaveLength(1);
    expect(result[0].url).toBe('foto.jpg');
  });
});

describe('getFirstImage', () => {
  it('devuelve la primera URL del array', () => {
    const images = [{ url: 'primera.jpg', sort_order: 0 }];
    expect(getFirstImage(images)).toBe('primera.jpg');
  });

  it('devuelve el placeholder si el array está vacío', () => {
    const result = getFirstImage([]);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});
