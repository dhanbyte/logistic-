import { getAdminUserDetail } from "@/lib/data/admin/users";
import { AdminUserDetailClient } from "@/components/admin/admin-user-detail-client";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const initialData = await getAdminUserDetail(id);

  return <AdminUserDetailClient initialData={initialData} />;
}
