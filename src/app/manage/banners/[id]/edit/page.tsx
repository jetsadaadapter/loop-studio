import { ManageBannerFormClient } from "@/app/manage/banners/manage-banner-form-client";

type EditBannerPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditBannerPage({
  params,
}: EditBannerPageProps) {
  const { id } = await params;

  return (
    <ManageBannerFormClient 
      mode="edit" 
      bannerId={id}
    />
  );
}
