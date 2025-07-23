/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['@libsql/client'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude libsql native binaries from webpack bundling
      config.externals.push('@libsql/linux-x64-gnu');
      config.externals.push('@libsql/darwin-x64');
      config.externals.push('@libsql/darwin-arm64');
      config.externals.push('@libsql/win32-x64-msvc');
    }
    return config;
  },
}

module.exports = nextConfig