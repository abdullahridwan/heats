import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Native/heavy server packages stay out of the bundle. The brand fonts and the tesseract
  // language data ship with the story and submission routes respectively.
  serverExternalPackages: ['@resvg/resvg-js', 'sharp', 'tesseract.js'],
  outputFileTracingIncludes: {
    '/api/story/**': ['./assets/fonts/**'],
    // Tesseract loads its worker script and WASM core dynamically, which static tracing can't see.
    '/api/submissions/**': ['./assets/tessdata/**', './node_modules/tesseract.js/**', './node_modules/tesseract.js-core/**'],
  },
}

export default nextConfig
