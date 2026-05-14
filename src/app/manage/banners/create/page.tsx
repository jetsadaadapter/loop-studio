import { ManageBannerFormClient } from "../manage-banner-form-client";

export default function CreateBannerPage() {
  const placeholders = {
    title: "Plan Smarter with Media Mix",
    subtitle: "Connect via MCP and start managing your media budget across channels — all from Claude.",
    sortOrder: 1,
    isActive: true,
  };

  const initialData = {
    title: "",
    subtitle: "",
    imageId: "",
    appId: "",
    isActive: true,
    startsAt: null,
    endsAt: null
  };

  return (
    <ManageBannerFormClient 
      mode="create" 
      initialData={initialData} 
      placeholders={placeholders} 
    />
  );
}
