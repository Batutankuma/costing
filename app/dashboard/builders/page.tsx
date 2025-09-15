import { listBuilders } from "./actions";
import Link from "next/link";
import DataTable from "./data-table";

export default async function Page() {
  const res = await listBuilders();
  const items = (res as any)?.data?.result ?? [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Builders</h1>
        <Link href="/dashboard/builders/create">
        </Link>
      </div>
      <DataTable items={items} />
    </div>
  );
}


