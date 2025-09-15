import { findByIdAction } from "../../actions";
import Link from "next/link";
import Client from "../price-edit-form";

export default async function EditPricePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await findByIdAction(id);
  const item = (res as any)?.result;

  if (!item) {
    return (
      <div className="p-6 space-y-4 max-w-xl mx-auto">
        <div className="text-destructive bg-destructive/10 p-4 rounded-md">
          <p className="font-medium">Structure introuvable.</p>
        </div>
        <Link className="underline" href="/dashboard/prices">Retour</Link>
      </div>
    );
  }

  return <Client initial={item} />;
}


