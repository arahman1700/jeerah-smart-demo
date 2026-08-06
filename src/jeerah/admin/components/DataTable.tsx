import type { ReactNode } from "react";

export interface DataColumn<Row> {
  key: string;
  header: ReactNode;
  render: (row: Row) => ReactNode;
}

/** A labeled admin table that scrolls horizontally inside its own container. */
export function DataTable<Row extends { id: string }>({
  label,
  columns,
  rows,
  empty,
}: {
  label: string;
  columns: Array<DataColumn<Row>>;
  rows: Row[];
  empty?: ReactNode;
}) {
  if (rows.length === 0 && empty) return <>{empty}</>;
  return (
    <div className="admin-table-scroll">
      <table className="admin-table" aria-label={label}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col">{column.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {columns.map((column) => (
                <td key={column.key}>{column.render(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
