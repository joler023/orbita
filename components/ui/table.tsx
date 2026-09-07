import { cn } from "@/lib/cn";
import type { ReactNode, TableHTMLAttributes } from "react";

export type TableColumn = {
  key: string;
  header: string;
  className?: string;
};

export type TableProps = TableHTMLAttributes<HTMLTableElement> & {
  columns: TableColumn[];
  children: ReactNode;
  caption?: string;
};

export function Table({ columns, children, caption, className, ...props }: TableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <table className={cn("w-full border-collapse text-left text-sm", className)} {...props}>
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead className="border-b border-border bg-orbita-50/60 text-muted">
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col" className={cn("px-4 py-3 font-medium", column.className)}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
