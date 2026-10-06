import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Native/heavy server packages stay out of the bundle. The brand fonts and the tesseract
  // language data ship with the story and submission routes respectively.
  serverExternalPackages: ['@resvg/resvg-js', 'sharp', 'tesseract.js'],
  outputFileTracingIncludes: {
    '/api/story/**': ['./assets/fonts/**'],
    '/api/submissions/**': ['./eng.traineddata'],
  },
}

export default nextConfig
