/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'ipfs.io',
      'gateway.pinata.cloud',
      'cloudflare-ipfs.com',
      'nftstorage.link',
      'arweave.net',
    ],
  },
}

module.exports = nextConfig
