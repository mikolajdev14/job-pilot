import { Navbar } from "@/components/layout/Navbar";
import { JobDetailsPage } from "@/components/jobs/JobDetailsPage";
import { getJobDetailsPageData } from "@/lib/job-details-server";

interface JobDetailsRouteProps {
  params: Promise<{ id: string }>;
}

export default async function JobDetailsRoute({ params }: JobDetailsRouteProps) {
  const { id } = await params;
  const job = await getJobDetailsPageData(id);

  return (
    <>
      <Navbar />
      <JobDetailsPage job={job} />
    </>
  );
}
