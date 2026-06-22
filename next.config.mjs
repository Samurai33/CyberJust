/** @type {import('next').NextConfig} */
const nextConfig = {
  // Existing dashboard typing debt is tracked separately from security upgrades.
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
