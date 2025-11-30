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

function LinkedProductsEditor({ depotId }: { depotId: string }) {
  const { toast } = useToast();
  const [rows, setRows] = useState<Array<{ productId: string; name: string; unit: string; quantity: number }>>([]);
  const [catalog, setCatalog] = useState<Array<{ id: string; name: string; unit: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const depot = await getDepotFull(depotId);
      const products = await getProducts();
      const initial = (depot?.products ?? []).map((dp: any) => ({
        productId: dp.productId,
        name: dp.product?.name ?? "",
        unit: dp.product?.unit ?? "",
        quantity: dp.quantity ?? 0,
      }));
      setRows(initial);
      setCatalog((products ?? []).map((p: any) => ({ id: p.id, name: p.name, unit: p.unit })));
      setLoading(false);
    })();
  }, [depotId]);

  const updateRow = (idx: number, patch: Partial<{ productId: string; name: string; unit: string; quantity: number }>) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };
  const addRow = () => setRows((prev) => [...prev, { productId: "", name: "", unit: "", quantity: 0 }]);
  const removeRow = (idx: number) => setRows((prev) => prev.filter((_, i) => i !== idx));

  const onSave = async () => {
    setSaving(true);
    try {
      const valid = rows.filter((r) => r.productId);
      const res = await updateDepotProducts({ depotId, items: valid } as any);
      if ((res as any)?.success) toast({ title: "Succès", description: "Produits mis à jour" });
      else toast({ title: "Erreur", description: (res as any)?.failure ?? "Mise à jour impossible", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-sm text-muted-foreground">Chargement...</div>;

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b bg-muted/50">
              <th className="py-2 px-3">Produit</th>
              <th className="py-2 px-3">Unité</th>
              <th className="py-2 px-3 text-right">Quantité</th>
              <th className="py-2 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td className="py-6 px-3 text-center text-muted-foreground" colSpan={4}>Aucun produit, ajoutez‑en un</td></tr>
            )}
            {rows.map((r, i) => (
              <tr key={`${r.productId}-${i}`} className="border-b last:border-0">
                <td className="py-2 px-3 w-[40%]">
                  <Select
                    value={r.productId}
                    onValueChange={(val) => {
                      const meta = catalog.find((p) => p.id === val);
                      updateRow(i, { productId: val, name: meta?.name ?? "", unit: meta?.unit ?? "" });
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Sélectionner un produit" /></SelectTrigger>
                    <SelectContent>
                      {catalog.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="py-2 px-3 align-middle">{r.unit || "—"}</td>
                <td className="py-2 px-3 text-right">
                  <Input
                    type="number"
                    step="any"
                    value={r.quantity as any}
                    onChange={(e) => updateRow(i, { quantity: e.target.value === "" ? 0 : Number(e.target.value) })}
                  />
                </td>
                <td className="py-2 px-3 text-right">
                  <Button variant="outline" size="sm" onClick={() => removeRow(i)}>Retirer</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between">
        <Button variant="outline" onClick={addRow}>Ajouter un produit</Button>
        <Button onClick={onSave} disabled={saving}>{saving ? "Enregistrement..." : "Enregistrer les produits"}</Button>
      </div>
    </div>
  );
}