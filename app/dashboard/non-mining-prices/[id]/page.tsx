import { getNonMiningPriceById } from "../actions";
import { NonMiningPriceEditForm } from "./non-mining-price-edit-form";
import { notFound } from "next/navigation";

interface NonMiningPriceEditPageProps {
  params: {
    id: string;
  };
}

export default async function NonMiningPriceEditPage({ params }: NonMiningPriceEditPageProps) {
  try {
    const { id } = await params;
    const priceStructure = await getNonMiningPriceById(id);
    return <NonMiningPriceEditForm priceStructure={priceStructure} />;
  } catch (error) {
    notFound();
  }
}
