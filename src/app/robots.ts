import { MetadataRoute } from "next";
import { getAppBaseUrl } from "@/lib/utils/url";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getAppBaseUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/signup", "/p/"],
        disallow: [
          "/dashboard/",
          "/admin/",
          "/api/",
          "/onboarding/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
