"use client";

import { cn } from "@/lib/utils";
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
    Columns3,
    ListFilter,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { columns } from "./columns";
import { useRouter } from "next/navigation";
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination";

type Module = {
    id: string;
    name: string;
    type: string;
    description: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    _count?: {
        userModules: number;
    };
};

export default function DataTables({ Element }: { Element: Module[] }) {
    const id = useId();
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const router = useRouter();
    const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
    const inputRef = useRef<HTMLInputElement>(null);
    const [sorting, setSorting] = useState<SortingState>([{ id: "name", desc: false }]);
    const [data, setData] = useState<Module[]>([]);
    
    useEffect(() => {
        setData(Element);
    }, [Element]);

    const table = useReactTable({
        data,
        columns: columns as any,
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
                            className={cn("peer min-w-60 ps-9")}
                            value={(table.getColumn("name")?.getFilterValue?.() ?? "") as string}
                            onChange={(e) => table.getColumn("name")?.setFilterValue?.(e.target.value)}
                            placeholder="Filtrer par nom..."
                            type="text"
                        />
                        <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80">
                            <ListFilter size={16} strokeWidth={2} aria-hidden="true" />
                        </div>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                <Columns3 className="-ms-1 me-2 opacity-60" size={16} strokeWidth={2} aria-hidden="true" />
                                Colonnes
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Colonnes visibles</DropdownMenuLabel>
                            {table.getAllColumns().filter((column) => column.getCanHide()).map((column) => (
                                <DropdownMenuCheckboxItem
                                    key={column.id}
                                    className="capitalize"
                                    checked={column.getIsVisible()}
                                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                    onSelect={(event) => event.preventDefault()}
                                >
                                    {column.id}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
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
                                                className={cn(header.column.getCanSort() && "flex h-full cursor-pointer select-none items-center justify-between gap-2")}
                                                onClick={header.column.getToggleSortingHandler()}
                                            >
                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                                {{
                                                    asc: <ChevronUp className="shrink-0 opacity-60" size={16} strokeWidth={2} aria-hidden="true" />,
                                                    desc: <ChevronDown className="shrink-0 opacity-60" size={16} strokeWidth={2} aria-hidden="true" />,
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
                    <Label htmlFor={id} className="max-sm:sr-only">Lignes par page</Label>
                    <Select value={table.getState().pagination.pageSize.toString()} onValueChange={(value) => { table.setPageSize(Number(value)); }}>
                        <SelectTrigger id={id} className="w-fit whitespace-nowrap">
                            <SelectValue placeholder="Sélectionner le nombre de résultats" />
                        </SelectTrigger>
                        <SelectContent>
                            {[5, 10, 25, 50].map((pageSize) => (
                                <SelectItem key={pageSize} value={pageSize.toString()}>{pageSize}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex grow justify-end whitespace-nowrap text-sm text-muted-foreground">
                    <p className="whitespace-nowrap text-sm text-muted-foreground" aria-live="polite">
                        <span className="text-foreground">
                            {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-
                            {Math.min(Math.max(table.getState().pagination.pageIndex * table.getState().pagination.pageSize + table.getState().pagination.pageSize, 0), table.getRowCount())}
                        </span> sur <span className="text-foreground">{table.getRowCount().toString()}</span>
                    </p>
                </div>
                <div>
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <Button size="icon" variant="outline" className="disabled:pointer-events-none disabled:opacity-50" onClick={() => table.firstPage()} disabled={!table.getCanPreviousPage()} aria-label="Première page">
                                    <ChevronFirst size={16} strokeWidth={2} aria-hidden="true" />
                                </Button>
                            </PaginationItem>
                            <PaginationItem>
                                <Button size="icon" variant="outline" className="disabled:pointer-events-none disabled:opacity-50" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} aria-label="Page précédente">
                                    <ChevronLeft size={16} strokeWidth={2} aria-hidden="true" />
                                </Button>
                            </PaginationItem>
                            <PaginationItem>
                                <Button size="icon" variant="outline" className="disabled:pointer-events-none disabled:opacity-50" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} aria-label="Page suivante">
                                    <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
                                </Button>
                            </PaginationItem>
                            <PaginationItem>
                                <Button size="icon" variant="outline" className="disabled:pointer-events-none disabled:opacity-50" onClick={() => table.lastPage()} disabled={!table.getCanNextPage()} aria-label="Dernière page">
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
