import { getNonMiningPriceById } from "../../actions";
import { NonMiningPriceView } from "./non-mining-price-view";
import { notFound } from "next/navigation";

interface NonMiningPriceViewPageProps {
  params: {
    id: string;
  };
}

export default async function NonMiningPriceViewPage({ params }: NonMiningPriceViewPageProps) {
  try {
    const { id } = await params;
    const priceStructure = await getNonMiningPriceById(id);
    return <NonMiningPriceView priceStructure={priceStructure} />;
  } catch (error) {
    notFound();
  }
}
