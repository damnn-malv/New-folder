export const DataTable = ({ columns, data, rowRenderer }) => (
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead>
        <tr style={{ background: "#1a2744" }}>
          {columns.map((h) => (
            <th
              key={h}
              className="p-3 text-left text-xs font-semibold uppercase tracking-wider text-white"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr>
            <td
              colSpan={columns.length}
              className="p-6 text-center text-gray-500"
            >
              No records found.
            </td>
          </tr>
        ) : (
          data.map((row, idx) =>
            rowRenderer(row, idx, {
              rowClass: `border-b border-gray-100 hover:bg-gray-50 transition ${
                idx % 2 === 0 ? "" : "bg-gray-50/50"
              }`,
              cellClass: "p-3 text-sm text-gray-700",
            })
          )
        )}
      </tbody>
    </table>
  </div>
);
