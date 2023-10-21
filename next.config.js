/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/edition",
        destination: "/edition/composer",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
