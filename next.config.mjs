/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "p16-oec-sg.ibyteimg.com" }
    ]
  }
};

export default nextConfig;
