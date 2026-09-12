/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath: "/treesminigameforbetul",
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig
