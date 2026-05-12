import { AdminDesignDetail } from "@/components/admin-design-detail";

export default async function DesignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminDesignDetail id={parseInt(id)} />;
}
