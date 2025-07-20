/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Optimize CSS loading and reduce preload warnings
  experimental: {
    optimizeCss: true,
  },
  
  // Optimize font loading
  optimizeFonts: true,
  
  // Configure webpack for better CSS handling
  webpack: (config, { dev, isServer }) => {
    // Optimize CSS extraction in production
    if (!dev && !isServer) {
      config.optimization.splitChunks.cacheGroups.styles = {
        name: 'styles',
        test: /\.(css|scss)$/,
        chunks: 'all',
        enforce: true,
      }
    }
    
    return config
  },
  
  // Configure headers for better resource loading
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig 