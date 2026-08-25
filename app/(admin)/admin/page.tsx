import type { Metadata } from "next";

import { WixDashboardLinks } from "./_components/wix-dashboard-links";

export const metadata: Metadata = { title: "Dashboard" };

export default function AdminDashboardPage() {
  return <WixDashboardLinks />;
}
