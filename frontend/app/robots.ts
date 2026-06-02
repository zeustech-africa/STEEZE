import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/admin/",
        "/_next/",
        "/verification/",
        "/signup/",
        "/login",
        "/forgot-password",
        "/reset-password",
        "/verify-email",
        "/unsubscribe",
        "/payment-cancelled",
        "/payment-success",
        "/offline",
      ],
    },
    sitemap: "https://steeze.com/sitemap.xml",
  };
}