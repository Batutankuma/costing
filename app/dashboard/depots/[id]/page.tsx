import EditDepotClient from "./edit-depot-client";

type PageProps = {
  params?: Promise<{ id: string }>;
};

export default async function EditDepotPage({ params }: PageProps) {
  const resolved = params ? await params : null;
  if (!resolved?.id) {
    return null;
  }
  return <EditDepotClient depotId={resolved.id} />;
}