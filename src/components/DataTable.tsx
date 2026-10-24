import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronsUpDown, ChevronUp, ChevronDown } from 'lucide-react';

export interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  sortValue?: (row: T) => string | number | boolean | null | undefined;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  onRowClick?: (row: T) => void;
  pageSize?: number;
  emptyMessage?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  rows,
  loading = false,
  onRowClick,
  pageSize = 15,
  emptyMessage = 'No matching records found in registry.',
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);

  // Reset to first page when rows list or sorting changes
  useEffect(() => {
    setCurrentPage(1);
  }, [rows.length, sortKey, sortAsc]);

  // Sorting with sortValue extractor support
  const sortedRows = useMemo(() => {
    if (!sortKey) return rows;
    const col = columns.find((c) => c.key === sortKey);

    return [...rows].sort((a, b) => {
      let valA = col?.sortValue ? col.sortValue(a) : a[sortKey];
      let valB = col?.sortValue ? col.sortValue(b) : b[sortKey];

      if (valA === valB) return 0;
      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortAsc ? valA - valB : valB - valA;
      }
      return sortAsc
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [rows, sortKey, sortAsc, columns]);

  // Pagination bounds
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const displayedRows = sortedRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              {columns.map((col) => {
                const isActiveSort = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    onClick={() => col.sortable && handleSort(col.key)}
                    className={`px-4 py-3 transition-colors ${
                      col.sortable
                        ? 'cursor-pointer select-none hover:bg-slate-100/90 group'
                        : ''
                    } ${
                      col.align === 'right'
                        ? 'text-right'
                        : col.align === 'center'
                        ? 'text-center'
                        : 'text-left'
                    } ${isActiveSort ? 'bg-blue-50/70 text-blue-900 font-bold' : ''} ${
                      col.headerClassName || ''
                    }`}
                  >
                    <div
                      className={`inline-flex items-center gap-1.5 ${
                        col.align === 'right'
                          ? 'justify-end w-full'
                          : col.align === 'center'
                          ? 'justify-center w-full'
                          : ''
                      }`}
                    >
                      <span>{col.label}</span>
                      {col.sortable && (
                        <span className="inline-flex items-center transition-transform">
                          {isActiveSort ? (
                            sortAsc ? (
                              <ChevronUp size={13} className="text-blue-600 shrink-0 stroke-[2.5]" />
                            ) : (
                              <ChevronDown size={13} className="text-blue-600 shrink-0 stroke-[2.5]" />
                            )
                          ) : (
                            <ChevronsUpDown
                              size={13}
                              className="text-slate-400 group-hover:text-slate-600 shrink-0"
                            />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-400">
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                    <span>Loading query data from repository...</span>
                  </div>
                </td>
              </tr>
            ) : displayedRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-400">
                  <div className="max-w-sm mx-auto space-y-2">
                    <div className="text-slate-600 font-medium">{emptyMessage}</div>
                    <p className="text-[11px] text-slate-400">
                      Try adjusting the search query, selecting different states or categories, or resetting the active filters.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              displayedRows.map((row, rIdx) => (
                <tr
                  key={row.id || rIdx}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`transition-colors ${
                    onRowClick ? 'cursor-pointer hover:bg-slate-50/90' : 'hover:bg-slate-50/40'
                  }`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-2.5 text-slate-700 ${
                        col.align === 'right'
                          ? 'text-right'
                          : col.align === 'center'
                          ? 'text-center'
                          : 'text-left'
                      } ${col.className || ''}`}
                    >
                      {col.render ? col.render(row) : row[col.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing <strong className="text-slate-800">{(currentPage - 1) * pageSize + 1}</strong> to{' '}
            <strong className="text-slate-800">
              {Math.min(currentPage * pageSize, sortedRows.length)}
            </strong>{' '}
            of <strong className="text-slate-800">{sortedRows.length}</strong> matching entries
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentPage(1);
              }}
              disabled={currentPage === 1}
              className="px-2 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-[11px]"
            >
              First
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentPage((p) => Math.max(1, p - 1));
              }}
              disabled={currentPage === 1}
              aria-label="Previous Page"
              className="p-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="px-2.5 font-mono font-semibold text-slate-800 text-[11px]">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentPage((p) => Math.min(totalPages, p + 1));
              }}
              disabled={currentPage === totalPages}
              aria-label="Next Page"
              className="p-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight size={14} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentPage(totalPages);
              }}
              disabled={currentPage === totalPages}
              className="px-2 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-[11px]"
            >
              Last
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
