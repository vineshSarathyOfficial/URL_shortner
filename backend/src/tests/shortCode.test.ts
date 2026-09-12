import { describe, it, expect } from 'vitest';
import { generateShortCode } from '../services/shortCodeGenerator.js';

describe('shortCodeGenerator', () => {
  it('generates 6-char lowercase alphanumeric codes', () => {
    const code = generateShortCode();
    expect(code).toHaveLength(6);
    expect(code).toMatch(/^[a-z0-9]{6}$/);
  });
});
