import { findBuilderById } from "../actions";
import BuilderEditForm from "./builder-edit-form";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await findBuilderById(id);
  const item = (res as any)?.result;
  if (!item) return <div className="p-6">Introuvable</div>;
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Modifier le builder</h1>
      <BuilderEditForm item={item} />
    </div>
  );
}


