"use client";

import { cn } from "@/lib/utils";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    ColumnFiltersState,
    PaginationState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFacetedUniqueValues,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import {
    ChevronDown,
    ChevronFirst,
    ChevronLast,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    CircleAlert,
    CircleX,
    Columns3,
    ListFilter,
    Trash,
} from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { columns, StockWithRelations } from "./columns";
import ExportExcel from "@/components/exportExcel";
import { useRouter } from "next/navigation";


type DepotOption = { id: string; name: string };
type CommandeLite = { id: string; produitId: string; depotId: string; fournisseurId: string; unitPrice: number; Fournisseur?: { nom?: string } };

export default function DataTables({ Element, Depots, Commandes }: { Element: StockWithRelations[]; Depots: DepotOption[]; Commandes: CommandeLite[] }) {
    const id = useId();
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const router = useRouter();
    const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10, });
    const inputRef = useRef<HTMLInputElement>(null);

    const [sorting, setSorting] = useState<SortingState>([{ id: "reference", desc: false, },]);
    const [selectedDepot, setSelectedDepot] = useState<string | "ALL">("ALL");
    const [selectedType, setSelectedType] = useState<"ALL" | "ENTREE" | "SORTIE">("ALL");
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");

    const [data, setData] = useState<StockWithRelations[]>([]);
    useEffect(() => { setData(Element); }, [Element]);

    const filteredData = useMemo(() => {
        return data.filter((row) => {
            const okDepot = selectedDepot === "ALL" || row.depotId === selectedDepot;
            const okStart = !startDate || new Date(row.date) >= new Date(startDate);
            const okEnd = !endDate || new Date(row.date) <= new Date(endDate);
            const okType = selectedType === "ALL" || row.type === selectedType;
            return okDepot && okStart && okEnd && okType;
        });
    }, [data, selectedDepot, startDate, endDate, selectedType]);

    const handleDeleteRows = () => {
        const selectedRows = table.getSelectedRowModel().rows;
        const updatedData = data.filter((item) => !selectedRows.some((row) => row.original.id === item.id),);
        setData(updatedData);
        table.resetRowSelection();
        // NOTE: Pour une application full-stack, cette suppression devrait également appeler une Server Action
        // ou une API route pour supprimer les données de la base de données.
    };

    const table = useReactTable({
        data: filteredData,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        onSortingChange: setSorting,
        enableSortingRemoval: false,
        getPaginationRowModel: getPaginationRowModel(),
        onPaginationChange: setPagination,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        getFilteredRowModel: getFilteredRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        state: { sorting, pagination, columnFilters, columnVisibility, },
    });


    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Input
                            id={`${id}-input`}
                            ref={inputRef}
                            className={cn(
                                "peer min-w-60 ps-9",
                                Boolean(table.getColumn("reference")?.getFilterValue()) && "pe-9",
                            )}
                            value={(table.getColumn("reference")?.getFilterValue() ?? "") as string}
                            onChange={(e) => table.getColumn("reference")?.setFilterValue(e.target.value)}
                            placeholder="Filtrer par référence..."
                            type="text"
                            aria-label="Filtrer par référence..."
                        />
                        <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
                            <ListFilter size={16} strokeWidth={2} aria-hidden="true" />
                        </div>
                        {Boolean(table.getColumn("reference")?.getFilterValue()) && (
                            <button
                                className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-lg text-muted-foreground/80 outline-offset-2 transition-colors hover:text-foreground focus:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                                aria-label="Clear filter"
                                onClick={() => {
                                    table.getColumn("reference")?.setFilterValue("");
                                    if (inputRef.current) {
                                        inputRef.current.focus();
                                    }
                                }}
                            >
                                <CircleX size={16} strokeWidth={2} aria-hidden="true" />
                            </button>
                        )}
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                <Columns3
                                    className="-ms-1 me-2 opacity-60"
                                    size={16}
                                    strokeWidth={2}
                                    aria-hidden="true"
                                />
                                Voir
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                            {table
                                .getAllColumns()
                                .filter((column) => column.getCanHide())
                                .map((column) => {
                                    return (
                                        <DropdownMenuCheckboxItem
                                            key={column.id}
                                            className="capitalize"
                                            checked={column.getIsVisible()}
                                            onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                            onSelect={(event) => event.preventDefault()}
                                        >
                                            {column.id}
                                        </DropdownMenuCheckboxItem>
                                    );
                                })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Label>Dépot</Label>
                        <Select value={selectedDepot} onValueChange={(v) => setSelectedDepot(v)}>
                            <SelectTrigger className="min-w-40"><SelectValue placeholder="Tous" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Tous</SelectItem>
                                {Depots.map((d) => (
                                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center gap-2">
                        <Label>Type</Label>
                        <Select value={selectedType} onValueChange={(v) => setSelectedType(v as "ALL" | "ENTREE" | "SORTIE")}>
                            <SelectTrigger className="min-w-32"><SelectValue placeholder="Tous" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Tous</SelectItem>
                                <SelectItem value="ENTREE">Entrée</SelectItem>
                                <SelectItem value="SORTIE">Sortie</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center gap-2">
                        <Label>Du</Label>
                        <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        <Label>Au</Label>
                        <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    </div>
                    {table.getSelectedRowModel().rows.length > 0 && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button className="ml-auto" variant="outline">
                                    <Trash
                                        className="-ms-1 me-2 opacity-60"
                                        size={16}
                                        strokeWidth={2}
                                        aria-hidden="true"
                                    />
                                    Delete
                                    <span className="-me-1 ms-3 inline-flex h-5 max-h-full items-center rounded border border-border bg-background px-1 font-[inherit] text-[0.625rem] font-medium text-muted-foreground/70">
                                        {table.getSelectedRowModel().rows.length}
                                    </span>
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <div className="flex flex-col gap-2 max-sm:items-center sm:flex-row sm:gap-4">
                                    <div
                                        className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border"
                                        aria-hidden="true"
                                    >
                                        <CircleAlert className="opacity-80" size={16} strokeWidth={2} />
                                    </div>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete{" "}
                                            {table.getSelectedRowModel().rows.length} selected{" "}
                                            {table.getSelectedRowModel().rows.length === 1 ? "row" : "rows"}.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                </div>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDeleteRows}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                    <Button disabled={true} onClick={() => router.push(`/dashboard/stock/stocks/create`)}>Create</Button>
                    <ExportExcel
                        data={filteredData}
                        filename="stocks"
                        mapRow={(row: StockWithRelations & { Fournisseur?: { nom?: string }; Client?: { nom?: string }; Produit?: { nom?: string }; Depot?: { name?: string }; deviseAchat?: string | null; deviseVente?: string | null; tauxChangeAchat?: string | null; tauxChangeVente?: string | null; prixVenteUnitaireConverti?: string | null; margeUnitaire?: number | null; margeTotale?: number | null; quantiteStockFinal?: string | null; pump?: string | null; valeurStockFinal?: string | null }) => {
                            // Trouver la commande correspondante (même produit + dépôt), la plus récente pertinente
                            const cmd = (Commandes || []).find((c) => c.produitId === row.produitId && c.depotId === row.depotId);
                            type AnyRow = { Fournisseur?: { nom?: string }; Client?: { nom?: string }; Produit?: { nom?: string }; Depot?: { name?: string }; fournisseur?: { nom?: string }; fournisseur_nom?: string; client?: { nom?: string }; client_nom?: string };
                            const ar = row as unknown as AnyRow;
                            const cmdF = (cmd && (cmd as unknown as { Fournisseur?: { nom?: string } }).Fournisseur?.nom) || '';
                            const fournisseurNom = cmdF || ar.Fournisseur?.nom || ar.fournisseur?.nom || ar.fournisseur_nom || '';
                            const clientNom = ar.Client?.nom || ar.client?.nom || ar.client_nom || '';
                            const acteur = row.type === 'ENTREE' ? fournisseurNom : clientNom;
                            const produitNom = row.Produit?.nom || row.produitId;
                            const depotNom = row.Depot?.name || row.depotId;
                            const prixUnitaireAchat = row.type === 'ENTREE'
                                ? (Number(row.prixUnitaireAchat ?? 0) || (cmd ? Number(cmd.unitPrice || 0) : null))
                                : (Number(row.prixUnitaireAchat ?? 0) || (cmd ? Number(cmd.unitPrice || 0) : null));
                            const prixUnitaireVente = Number(row.prixUnitaireVente ?? 0) || null;
                            const totalAchat = prixUnitaireAchat != null ? prixUnitaireAchat * (row.quantite ?? 0) : null;
                            const totalVente = prixUnitaireVente != null ? prixUnitaireVente * (row.quantite ?? 0) : null;
                            const unitMargin = row.margeUnitaire != null
                                ? row.margeUnitaire
                                : (row.type === 'SORTIE' && prixUnitaireVente != null && prixUnitaireAchat != null)
                                    ? (prixUnitaireVente - prixUnitaireAchat)
                                    : null;
                            const totalMargin = row.margeTotale != null
                                ? row.margeTotale
                                : unitMargin != null ? unitMargin * (row.quantite ?? 0) : null;
                            return {
                                Date: row.date,
                                Ref: row.reference,
                                'Fourn./Client': acteur,
                                Produit: produitNom,
                                Dépôt: depotNom,
                                Type: row.type,
                                Qté: row.quantite,
                                'PU Achat': prixUnitaireAchat,
                                'PU Vente': prixUnitaireVente,
                                'Devise Achat': row.deviseAchat ?? '',
                                'Devise Vente': row.deviseVente ?? '',
                                'Taux change achat': row.tauxChangeAchat ?? '',
                                'Taux change vente': row.tauxChangeVente ?? '',
                                'Total Achat': totalAchat,
                                'Total Vente': totalVente,
                                'Prix vente unitaire (converti)': row.prixVenteUnitaireConverti ?? '',
                                'Marge unitaire': unitMargin,
                                'Marge totale': totalMargin,
                                'Valeur entrée': row.valeurEntree ?? '',
                                'Valeur sortie': row.valeurSortie ?? '',
                                'Qté stock final': row.quantiteStockFinal ?? '',
                                PUMP: row.pump ?? '',
                                'Valeur stock final': row.valeurStockFinal ?? '',
                            } as Record<string, unknown>;
                        }}
                    />
                </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-border bg-background">
                <Table className="table-fixed">
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="hover:bg-transparent">
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead
                                            key={header.id}
                                            style={{ width: (header.getSize && header.getSize()) ? String(header.getSize()) + 'px' : undefined }}
                                            className="h-11"
                                        >
                                            {header.isPlaceholder ? null : header.column.getCanSort() ? (
                                                <div
                                                    className={cn(
                                                        header.column.getCanSort() &&
                                                        "flex h-full cursor-pointer select-none items-center justify-between gap-2",
                                                    )}
                                                    onClick={header.column.getToggleSortingHandler()}
                                                    onKeyDown={(e) => {
                                                        if (
                                                            header.column.getCanSort() &&
                                                            (e.key === "Enter" || e.key === " ")
                                                        ) {
                                                            e.preventDefault();
                                                            header.column.getToggleSortingHandler()?.(e);
                                                        }
                                                    }}
                                                    tabIndex={header.column.getCanSort() ? 0 : undefined}
                                                >
                                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                                    {{
                                                        asc: (
                                                            <ChevronUp
                                                                className="shrink-0 opacity-60"
                                                                size={16}
                                                                strokeWidth={2}
                                                                aria-hidden="true"
                                                            />
                                                        ),
                                                        desc: (
                                                            <ChevronDown
                                                                className="shrink-0 opacity-60"
                                                                size={16}
                                                                strokeWidth={2}
                                                                aria-hidden="true"
                                                            />
                                                        ),
                                                    }[header.column.getIsSorted() as string] ?? null}
                                                </div>
                                            ) : (
                                                flexRender(header.column.columnDef.header, header.getContext())
                                            )}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.original.id} data-state={row.getIsSelected() && "selected"}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="last:py-0">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-between gap-8">
                <div className="flex items-center gap-3">
                    <Label htmlFor={id} className="max-sm:sr-only">
                        Rows per page
                    </Label>
                    <Select
                        value={table.getState().pagination.pageSize.toString()}
                        onValueChange={(value) => {
                            table.setPageSize(Number(value));
                        }}
                    >
                        <SelectTrigger id={id} className="w-fit whitespace-nowrap">
                            <SelectValue placeholder="Select number of results" />
                        </SelectTrigger>
                        <SelectContent className="[&_*[role=option]>span]:end-2 [&_*[role=option]>span]:start-auto [&_*[role=option]]:pe-8 [&_*[role=option]]:ps-2">
                            {[5, 10, 25, 50].map((pageSize) => (
                                <SelectItem key={pageSize} value={pageSize.toString()}>
                                    {pageSize}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex grow justify-end whitespace-nowrap text-sm text-muted-foreground">
                    <p className="whitespace-nowrap text-sm text-muted-foreground" aria-live="polite">
                        <span className="text-foreground">
                            {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-
                            {Math.min(
                                Math.max(
                                    table.getState().pagination.pageIndex * table.getState().pagination.pageSize +
                                    table.getState().pagination.pageSize,
                                    0,
                                ),
                                table.getRowCount(),
                            )}
                        </span>{" "}
                        of <span className="text-foreground">{table.getRowCount().toString()}</span>
                    </p>
                </div>

                <div>
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <Button
                                    size="icon"
                                    variant="outline"
                                    className="disabled:pointer-events-none disabled:opacity-50"
                                    onClick={() => table.firstPage()}
                                    disabled={!table.getCanPreviousPage()}
                                    aria-label="Go to first page"
                                >
                                    <ChevronFirst size={16} strokeWidth={2} aria-hidden="true" />
                                </Button>
                            </PaginationItem>
                            <PaginationItem>
                                <Button
                                    size="icon"
                                    variant="outline"
                                    className="disabled:pointer-events-none disabled:opacity-50"
                                    onClick={() => table.previousPage()}
                                    disabled={!table.getCanPreviousPage()}
                                    aria-label="Go to previous page"
                                >
                                    <ChevronLeft size={16} strokeWidth={2} aria-hidden="true" />
                                </Button>
                            </PaginationItem>
                            <PaginationItem>
                                <Button
                                    size="icon"
                                    variant="outline"
                                    className="disabled:pointer-events-none disabled:opacity-50"
                                    onClick={() => table.nextPage()}
                                    disabled={!table.getCanNextPage()}
                                    aria-label="Go to next page"
                                >
                                    <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
                                </Button>
                            </PaginationItem>
                            <PaginationItem>
                                <Button
                                    size="icon"
                                    variant="outline"
                                    className="disabled:pointer-events-none disabled:opacity-50"
                                    onClick={() => table.lastPage()}
                                    disabled={!table.getCanNextPage()}
                                    aria-label="Go to last page"
                                >
                                    <ChevronLast size={16} strokeWidth={2} aria-hidden="true" />
                                </Button>
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            </div>
        </div>
    );
}
