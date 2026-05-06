'use client';

import DataTables from "./data-table";
import { DeliveryWithRelations } from "./columns";

type TemplateOptions = {
  clients: Array<{ id: string; name: string }>;
  transporters: Array<{ id: string; nom: string }>;
  depots: Array<{ id: string; name: string }>;
  products: Array<{ id: string; nom: string }>;
  clientOrders: Array<{
    id: string;
    reference: string;
    clientId: string;
    produitId: string;
    unitPrice: number;
    clientName: string;
    productName: string;
  }>;
};

export default function DataTablesWrapper({
  Element,
  templateOptions,
}: {
  Element: DeliveryWithRelations[];
  templateOptions?: TemplateOptions;
}) {
  return <DataTables Element={Element} templateOptions={templateOptions} />;
}
