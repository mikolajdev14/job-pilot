import { Navbar } from "@/components/layout/Navbar";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { getProfilePageData } from "@/lib/profile-server";

export default async function ProfilePage() {
  const { profile, loadError } = await getProfilePageData();

  return (
    <>
      <Navbar />
      <ProfileForm initialProfile={profile} loadError={loadError} />
    </>
  );
}
