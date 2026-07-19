/** @type {import('next').NextConfig} */
if (process.env.NODE_ENV === 'development') {
  import('@opennextjs/cloudflare').then(({ initOpenNextCloudflareForDev }) => initOpenNextCloudflareForDev())
}

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  transpilePackages: ['three'],
}

module.exports = nextConfig
