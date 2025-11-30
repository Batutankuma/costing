import { notFound } from "next/navigation";
import { getProductById } from "../actions";
import EditProductClient from "./edit-product-client";

export default async function EditProductPage({
  params,
}: {
  params?: Promise<{ id: string }>;
}) {
  const resolved = params ? await params : null;
  if (!resolved?.id) {
    notFound();
  }

  const result = await getProductById({ id: resolved.id });
  const product = (result as any)?.data;
  if (!product) {
    notFound();
  }

  return <EditProductClient initialProduct={product} />;
}


