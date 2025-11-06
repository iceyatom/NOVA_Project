/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.nilesbio.com",
        pathname: "/images/**",
      },
    ],
  },
};

export default nextConfig;
