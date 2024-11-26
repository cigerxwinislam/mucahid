// Bismillahirahmanirahim



// next.config.js

module.exports = {

    experimental: {
        serverComponentsExternalPackages: ["axios", "mongoose"],
    },
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "th.bing.com",
                pathname: "**",
            },
            {
                protocol: "https",
                hostname: "res.cloudinary.com",
                pathname: "**",
            },
            {
                protocol: "https",
                hostname: "files.edgestore.dev",
                pathname: "**",
            },
        ],
    },
    reactStrictMode: true,
    eslint: {
        ignoreDuringBuilds: true,
    },
}
