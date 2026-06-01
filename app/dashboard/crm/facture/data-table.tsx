'use client';

import * as React from "react";
import { useReactTable, ColumnFiltersState, SortingState, VisibilityState, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, flexRender } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { columns, FactureRow } from "./columns";
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, CircleX, Filter } from "lucide-react";
import Link from "next/link";
import { formatManualFactureCurrency } from "@/lib/manual-facture-format";

export default function FactureDataTable({ data }: { data: FactureRow[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "invoiceDate", desc: true }]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, columnVisibility },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:w-auto">
          <Input
            placeholder="Rechercher une facture"
            value={(table.getColumn("invoiceNumber")?.getFilterValue() as string) ?? ""}
            onChange={(event) => table.getColumn("invoiceNumber")?.setFilterValue(event.target.value)}
            className="ps-9 w-full lg:min-w-[240px]"
          />
          <Filter className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          {table.getColumn("invoiceNumber")?.getFilterValue() ? (
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
              onClick={() => table.getColumn("invoiceNumber")?.setFilterValue("")}
              type="button"
            >
              <CircleX className="h-4 w-4" />
            </button>
          ) : null}
        </div>
        <div className="flex w-full items-center gap-2 text-sm text-muted-foreground lg:w-auto lg:justify-end">
          Colonnes
          <Select onValueChange={(value) => table.getAllColumns().forEach((column) => column.toggleVisibility(value === 'all' || column.id === value))}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Affichage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tout afficher</SelectItem>
              {table.getAllLeafColumns().map((column) => (
                <SelectItem key={column.id} value={column.id}>{column.columnDef.header as string}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3 md:hidden">
        {table.getRowModel().rows.length ? (
          table.getRowModel().rows.map((row) => (
            <div key={row.original.id} className="rounded-lg border bg-background p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold">{row.original.invoiceNumber}</p>
                <p className="text-sm font-medium">
                  {formatManualFactureCurrency(row.original.total, row.original.currency || "USD")}
                </p>
              </div>
              <div className="text-sm space-y-1">
                <p><span className="text-muted-foreground">Client:</span> {row.original.clientName}</p>
                <p><span className="text-muted-foreground">Date:</span> {new Date(row.original.invoiceDate).toLocaleDateString('fr-FR')}</p>
              </div>
              <div className="flex gap-2 pt-1">
                <Button asChild size="sm" variant="outline" className="flex-1">
                  <Link href={`/dashboard/crm/facture/views/${row.original.id}`}>Voir</Link>
                </Button>
                <Button asChild size="sm" className="flex-1">
                  <Link href={`/dashboard/crm/facture/${row.original.id}`}>Modifier</Link>
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="h-24 rounded-lg border bg-background grid place-items-center text-sm text-muted-foreground">
            Aucune facture trouvee.
          </div>
        )}
      </div>

      <div className="hidden md:block overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">Aucune facture trouvée.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          Lignes par page
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[5, 10, 25, 50].map((size) => (
                <SelectItem key={size} value={`${size}`}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Pagination className="self-end sm:self-auto">
          <PaginationContent>
            <PaginationItem>
              <Button
                variant="outline"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </PaginationItem>
            <PaginationItem>
              <Button
                variant="outline"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
