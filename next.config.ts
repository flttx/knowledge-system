import type { NextConfig } from "next";

const codeMirrorAliases = {
  "@codemirror/state": "./node_modules/@codemirror/state",
  "@codemirror/view": "./node_modules/@codemirror/view",
};

const securityHeaders = [
  ...(process.env.NODE_ENV === "development"
    ? []
    : [{ key: "X-Content-Type-Options", value: "nosniff" }]),
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: codeMirrorAliases,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
