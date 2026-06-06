import type { Metadata } from "next";

import { HomePageClient } from "@/components/home-page-client";

export const metadata: Metadata = {
  title: "AI IDE Template · Clone & Deploy",
  description:
    "A Next.js App Router template with a GitHub CLI clone helper, AI SDK streaming chat, and VPS Podman deployment flow.",
};

export default function HomePage() {
  return <HomePageClient />;
}
