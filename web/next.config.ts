import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // resvg is a native module; keep it out of the bundle and ship the brand fonts with the story routes
  serverExternalPackages: ['@resvg/resvg-js'],
  outputFileTracingIncludes: { '/api/story/**': ['./assets/fonts/**'] },
}

export default nextConfig
