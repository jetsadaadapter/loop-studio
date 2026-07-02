import { ManageAppFormClient } from "@/app/manage/apps/manage-app-form-client";

type EditManageAppPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditManageAppPage({
  params,
}: EditManageAppPageProps) {
  const { id } = await params;
  return <ManageAppFormClient mode="edit" appId={id} />;
}
