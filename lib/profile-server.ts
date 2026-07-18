import { redirect } from "next/navigation";
import { createInsforgeServer } from "@/lib/insforge-server";
import { emptyProfile, profileRecordToForm } from "@/lib/profile-utils";
import type { ProfileRecord, ProfileFormValues } from "@/lib/profile-types";

type ProfilePageData = {
  profile: ProfileFormValues;
  loadError?: string;
};

export async function getProfilePageData(): Promise<ProfilePageData> {
  const insforge = await createInsforgeServer();
  const { data: currentUserData, error: currentUserError } = await insforge.auth.getCurrentUser();
  const user = currentUserData?.user;

  if (currentUserError || !user) {
    redirect("/login");
  }

  const { data, error } = await insforge.database
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[profile/page] Could not load profile", error);
    return {
      profile: emptyProfile(user.email ?? ""),
      loadError: "We could not load your saved profile. You can try saving it again.",
    };
  }

  return {
    profile: data
      ? profileRecordToForm(data as ProfileRecord, user.email ?? "")
      : emptyProfile(user.email ?? ""),
  };
}
