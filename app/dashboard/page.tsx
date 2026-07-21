import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { getDashboardPageData } from "@/lib/dashboard-server";

export default async function DashboardRoute() {
  const data = await getDashboardPageData();
  return <DashboardPage data={data} />;
}
