/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  // Let phones on the tailnet load dev assets (HMR, client chunks).
  allowedDevOrigins: ["100.*.*.*", "*.ts.net"],
  async headers() {
    return [
      {
        // Ledger pages carry private links and payment details.
        source: "/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Referrer-Policy", value: "no-referrer" },
        ],
      },
    ];
  },
};

export default nextConfig;
