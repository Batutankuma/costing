import { getKalemieBuilderById } from "../actions";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import KalemieEditForm from "./edit-form";

interface Props { params: Promise<{ id: string }> }

export default async function EditKalemiePage({ params }: Props) {
  const { id } = await params;
  const res = await getKalemieBuilderById(id);
  const item = (res as any)?.result ?? null;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/build-const-kalemie"><Button variant="outline">Retour</Button></Link>
        <h1 className="text-2xl font-semibold">Modifier Build-Const Kalemie</h1>
      </div>
      <KalemieEditForm item={item} />
    </div>
  );
}
