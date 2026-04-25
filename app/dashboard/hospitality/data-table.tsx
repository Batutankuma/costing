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
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { ChevronDown, ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, ChevronUp, CircleX, Columns3, ListFilter } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { columns, HospitalityWithRelations } from "./columns";
import { useRouter } from "next/navigation";
import ExportExcel from "@/components/exportExcel";
import ImportHospitalityExcel from "./import-excel";

type TemplateOptions = {
  suppliers: Array<{ id: string; nom: string }>;
  transporters: Array<{ id: string; nom: string }>;
  depots: Array<{ id: string; name: string }>;
  commandes: Array<{ id: string; reference: string; depotId: string | null }>;
};

export default function DataTables({ Element, templateOptions }: { Element: HospitalityWithRelations[]; templateOptions: TemplateOptions }) {
  const id = useId();
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const router = useRouter();
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const inputRef = useRef<HTMLInputElement>(null);
  const [sorting, setSorting] = useState<SortingState>([{ id: "driverName", desc: false }]);
  const [data, setData] = useState<HospitalityWithRelations[]>([]);
  useEffect(() => setData(Element), [Element]);

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
              className={cn("peer min-w-60 ps-9", Boolean(table.getColumn("driverName")?.getFilterValue()) && "pe-9")}
              value={(table.getColumn("driverName")?.getFilterValue() ?? "") as string}
              onChange={(e) => table.getColumn("driverName")?.setFilterValue(e.target.value)}
              placeholder="Rechercher driver..."
              type="text"
            />
            <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80">
              <ListFilter size={16} strokeWidth={2} aria-hidden="true" />
            </div>
            {Boolean(table.getColumn("driverName")?.getFilterValue()) && (
              <button
                className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-lg text-muted-foreground/80 hover:text-foreground"
                onClick={() => {
                  table.getColumn("driverName")?.setFilterValue("");
                  inputRef.current?.focus();
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
              <DropdownMenuLabel>Afficher/Masquer</DropdownMenuLabel>
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
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
        <div className="flex items-center gap-2">
          <Button onClick={() => router.push("/dashboard/hospitality/create")}>Nouvelle ligne</Button>
          <ImportHospitalityExcel options={templateOptions} />
          <ExportExcel
            data={data}
            filename="hospitality-lubumbashi"
            mapRow={(row: HospitalityWithRelations) => ({
              "Driver s name": row.driverName,
              SUPPLIER: row.supplier.nom,
              TRANSPORTER: row.transporter.nom,
              "Truck No.": row.truckNo,
              "Trailer No.": row.trailerNo,
              Depot: row.depot.name,
              "Quantity Order": row.quantityOrder,
              "OFFL QTY @20": row.offlQty20,
              "VARIANCE QTY @20": row.varianceQty20,
              "Transit Allowable LOSS": row.transitAllowableLoss,
              "Dis-Allowable LOSS": row.disAllowableLoss,
              "Rate ($)": row.rate,
              "Total ($)": row.total,
            })}
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-background">
        <Table className="table-fixed text-xs">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <div className="flex h-full cursor-pointer select-none items-center justify-between gap-2" onClick={header.column.getToggleSortingHandler()}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{
                          asc: <ChevronUp className="shrink-0 opacity-60" size={16} />,
                          desc: <ChevronDown className="shrink-0 opacity-60" size={16} />,
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
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
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
          <Select value={table.getState().pagination.pageSize.toString()} onValueChange={(value) => table.setPageSize(Number(value))}>
            <SelectTrigger id={id} className="w-fit whitespace-nowrap">
              <SelectValue placeholder="Nb résultats" />
            </SelectTrigger>
            <SelectContent>
              {[5, 10, 25, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={pageSize.toString()}>{pageSize}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex grow justify-end whitespace-nowrap text-sm text-muted-foreground">
          <p>
            <span className="text-foreground">
              {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-
              {Math.min(
                table.getState().pagination.pageIndex * table.getState().pagination.pageSize + table.getState().pagination.pageSize,
                table.getRowCount()
              )}
            </span>{" "}
            sur <span className="text-foreground">{table.getRowCount()}</span>
          </p>
        </div>
        <div>
          <Pagination>
            <PaginationContent>
              <PaginationItem><Button size="icon" variant="outline" onClick={() => table.firstPage()} disabled={!table.getCanPreviousPage()}><ChevronFirst size={16} /></Button></PaginationItem>
              <PaginationItem><Button size="icon" variant="outline" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}><ChevronLeft size={16} /></Button></PaginationItem>
              <PaginationItem><Button size="icon" variant="outline" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}><ChevronRight size={16} /></Button></PaginationItem>
              <PaginationItem><Button size="icon" variant="outline" onClick={() => table.lastPage()} disabled={!table.getCanNextPage()}><ChevronLast size={16} /></Button></PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
}
