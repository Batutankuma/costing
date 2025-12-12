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
import { columns, BuilderWithRelations } from "./columns";
import ExportExcel from "@/components/exportExcel";
import { useRouter } from "next/navigation";
import { deleteBuilder } from "./actions";

type BuilderItem = {
    id: string;
    date: Date | string;
    title: string;
    unit: string;
    description?: string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
    priceReference?: {
        nomStructure: string;
    } | null;
    nonMiningPriceStructure?: {
        nomStructure: string;
    } | null;
    totals?: {
        priceDDUUSD?: number | null;
        priceDDPUSD?: number | null;
    } | null;
};

export default function DataTable({ items }: { items: BuilderItem[] }) {
    const id = useId();

    const mapped: BuilderWithRelations[] = useMemo(() => (items ?? []).map((it: BuilderItem) => ({
        id: it.id,
        date: new Date(it.date),
        title: it.title,
        unit: it.unit,
        description: it.description,
        createdAt: new Date(it.createdAt),
        updatedAt: new Date(it.updatedAt),
        priceReference: it.priceReference,
        nonMiningPriceStructure: it.nonMiningPriceStructure,
        totals: it.totals,
    })), [items]);

    const [data, setData] = useState<BuilderWithRelations[]>(mapped);
    useEffect(() => setData(mapped), [mapped]);

    const [sorting, setSorting] = useState<SortingState>([{ id: "title", desc: false }]);
    const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const handleDeleteRows = async () => {
        const selectedRows = table.getSelectedRowModel().rows;
        const idsToDelete = selectedRows.map((row) => row.original.id);

        for (const idToDelete of idsToDelete) {
            await deleteBuilder({ id: idToDelete });
        }

        const updatedData = data.filter((item) => !idsToDelete.includes(item.id));
        setData(updatedData);
        table.resetRowSelection();
        router.refresh();
    };

    const table = useReactTable({
        data,
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
        state: { sorting, pagination, columnFilters, columnVisibility },
    });

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Input
                            id={`${id}-input`}
                            ref={inputRef}
                            className={cn("peer min-w-60 ps-9", Boolean(table.getColumn("title")?.getFilterValue()) && "pe-9")}
                            value={(table.getColumn("title")?.getFilterValue() ?? "") as string}
                            onChange={(e) => table.getColumn("title")?.setFilterValue(e.target.value)}
                            placeholder="Filtrer par titre..."
                            type="text"
                            aria-label="Filtrer par titre"
                        />
                        <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
                            <ListFilter size={16} strokeWidth={2} aria-hidden="true" />
                        </div>
                        {Boolean(table.getColumn("title")?.getFilterValue()) && (
                            <button
                                className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-lg text-muted-foreground/80 outline-offset-2 transition-colors hover:text-foreground focus:z-10 focus-visible:outline focus-visible:outline-ring/70 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                                aria-label="Effacer le filtre"
                                onClick={() => {
                                    table.getColumn("title")?.setFilterValue("");
                                    if (inputRef.current) inputRef.current.focus();
                                }}
                            >
                                <CircleX size={16} strokeWidth={2} aria-hidden="true" />
                            </button>
                        )}
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                <Columns3 className="-ms-1 me-2 opacity-60" size={16} strokeWidth={2} aria-hidden="true" />
                                Colonnes
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Afficher/masquer les colonnes</DropdownMenuLabel>
                            {table.getAllColumns().filter((column) => column.getCanHide()).map((column) => (
                                <DropdownMenuCheckboxItem
                                    key={column.id}
                                    className="capitalize"
                                    checked={column.getIsVisible()}
                                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                    onSelect={(e) => e.preventDefault()}
                                >
                                    {column.id}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="flex items-center gap-3">
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
                                    Supprimer
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
                                        <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Cette action est irréversible. Cela supprimera définitivement{" "}
                                            {table.getSelectedRowModel().rows.length}{" "}
                                            {table.getSelectedRowModel().rows.length === 1 ? "ligne" : "lignes"} sélectionnée(s).
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                </div>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDeleteRows}>Supprimer</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                    <Button onClick={()=> router.push(`/dashboard/builders/create`) }>Nouveau Cost Build Up</Button>
                    <ExportExcel
                      data={data}
                      filename="cost-build-up-minier"
                      mapRow={(row: BuilderWithRelations) => {
                        return {
                          Date: row.date.toLocaleDateString('fr-FR'),
                          Titre: row.title,
                          'Unité': row.unit,
                          'Prix DDP (USD)': row.totals?.priceDDPUSD || '',
                          'Créé le': row.createdAt.toLocaleDateString('fr-FR'),
                        };
                      }}
                    />
                </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-border bg-background">
                <Table className="table-fixed">
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="hover:bg-transparent">
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id} style={{ width: `${header.getSize()}px` }} className="h-11">
                                        {header.isPlaceholder ? null : header.column.getCanSort() ? (
                                            <div
                                                className={cn(
                                                    header.column.getCanSort() &&
                                                        "flex h-full cursor-pointer select-none items-center justify-between gap-2",
                                                )}
                                                onClick={header.column.getToggleSortingHandler()}
                                                onKeyDown={(e) => {
                                                    if (header.column.getCanSort() && (e.key === "Enter" || e.key === " ")) {
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
                                ))}
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
                                    Aucun résultat.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-between gap-8">
                <div className="flex items-center gap-3">
                    <Label htmlFor={id} className="max-sm:sr-only">
                        Lignes par page
                    </Label>
                    <Select value={String(table.getState().pagination.pageSize)} onValueChange={(value) => table.setPageSize(Number(value))}>
                        <SelectTrigger id={id} className="w-fit whitespace-nowrap">
                            <SelectValue placeholder="Sélectionner le nombre de résultats" />
                        </SelectTrigger>
                        <SelectContent>
                            {[5, 10, 25, 50].map((pageSize) => (
                                <SelectItem key={pageSize} value={String(pageSize)}>{pageSize}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex grow justify-end whitespace-nowrap text-sm text-muted-foreground">
                    <p className="whitespace-nowrap text-sm text-muted-foreground" aria-live="polite">
                        <span className="text-foreground">
                            {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
                            -
                            {Math.min(
                                table.getState().pagination.pageIndex * table.getState().pagination.pageSize + table.getState().pagination.pageSize,
                                table.getRowCount(),
                            )}
                        </span>{" "}
                        sur {table.getRowCount()}
                    </p>
                </div>
                <div>
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <Button size="icon" variant="outline" onClick={() => table.firstPage()} disabled={!table.getCanPreviousPage()} aria-label="Première page">
                                    <ChevronFirst size={16} strokeWidth={2} aria-hidden="true" />
                                </Button>
                            </PaginationItem>
                            <PaginationItem>
                                <Button size="icon" variant="outline" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} aria-label="Page précédente">
                                    <ChevronLeft size={16} strokeWidth={2} aria-hidden="true" />
                                </Button>
                            </PaginationItem>
                            <PaginationItem>
                                <Button size="icon" variant="outline" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} aria-label="Page suivante">
                                    <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
                                </Button>
                            </PaginationItem>
                            <PaginationItem>
                                <Button size="icon" variant="outline" onClick={() => table.lastPage()} disabled={!table.getCanNextPage()} aria-label="Dernière page">
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

