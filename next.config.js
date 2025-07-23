/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['@libsql/client', 'libsql'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Force webpack to ignore libsql native binaries
      config.externals = config.externals || [];
      config.externals.push({
        '@libsql/linux-x64-gnu': 'commonjs @libsql/linux-x64-gnu',
        '@libsql/darwin-x64': 'commonjs @libsql/darwin-x64', 
        '@libsql/darwin-arm64': 'commonjs @libsql/darwin-arm64',
        '@libsql/win32-x64-msvc': 'commonjs @libsql/win32-x64-msvc',
        'libsql': 'commonjs libsql'
      });
    }
    return config;
  },
}

module.exports = nextConfig