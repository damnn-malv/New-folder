import { DataTable } from "../../../components/ui/dataTable";
export default function CollectionRecords({
  filters,
  setFilters,
  showAllCollections,
  setShowAllCollections,
  filteredCollections,
  visibleCollections,
  handleExportCSV,
  handleExportPDF,
  peso,
  cardStyle,
  cardHeaderStyle,
  cardTitleStyle,
  btnExport,
  btnSecondary,
}) {
  return (
    <div className="rpt-card rpt-section">
      <div className="rpt-card-header">
        <div className="rpt-card-header-left">
          <span className="rpt-card-title">Collection Records</span>

          <div className="rpt-batch-toggle">
            {[
              ["all", "All"],
              ["batch1", "Batch 1"],
              ["batch2", "Batch 2"],
            ].map(([val, lbl]) => (
              <button
                key={val}
                className={`rpt-batch-btn ${filters.batch === val ? "rpt-batch-btn--active" : ""}`}
                onClick={() => {
                  setFilters((f) => ({ ...f, batch: val }));
                  setShowAllCollections(false);
                }}
              >
                {lbl}
              </button>
            ))}
          </div>

          <span className="rpt-record-count">
            {showAllCollections
              ? filteredCollections.length
              : Math.min(5, filteredCollections.length)}{" "}
            of {filteredCollections.length} record(s)
          </span>
        </div>

        <div className="rpt-card-header-actions">
          <button
            className="rpt-btn-export rpt-btn-export--green"
            onClick={handleExportCSV}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            CSV
          </button>
          <button
            className="rpt-btn-export rpt-btn-export--navy"
            onClick={handleExportPDF}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            PDF
          </button>
        </div>
      </div>

      <DataTable
        columns={[
          "Date & Time",
          "Batch",
          "Ticket ID",
          "Driver",
          "Vehicle",
          "Route",
          "Amount",
        ]}
        data={visibleCollections}
        rowRenderer={(r, idx, { rowClass, cellClass }) => (
          <tr key={r.id} className={rowClass}>
            <td className={cellClass}>{r.issued_at}</td>
            <td className={cellClass}>
              <span
                className={`rpt-batch-pill ${r.batch === "Batch 1" ? "rpt-batch-pill--b1" : "rpt-batch-pill--b2"}`}
              >
                {r.batch}
              </span>
            </td>
            <td className={`${cellClass} rpt-mono`}>{r.id}</td>
            <td className={cellClass}>{r.driver}</td>
            <td className={cellClass}>
              <span className="rpt-plate">{r.vehicle}</span>
            </td>
            <td className={cellClass}>{r.route}</td>
            <td className={`${cellClass} rpt-amount`}>
              {peso(Number(r.collection_amount) || 0)}
            </td>
          </tr>
        )}
      />

      {filteredCollections.length > 0 && (
        <div className="rpt-totals-row">
          <span>Total ({filteredCollections.length} tickets)</span>
          <span className="rpt-totals-amount">
            {peso(
              filteredCollections.reduce(
                (s, r) => s + Number(r.collection_amount || 0),
                0,
              ),
            )}
          </span>
        </div>
      )}

      {filteredCollections.length > 5 && (
        <div className="rpt-show-more">
          <button
            className="rpt-btn rpt-btn--secondary"
            onClick={() => setShowAllCollections((v) => !v)}
          >
            {showAllCollections
              ? "Show Less"
              : `View All ${filteredCollections.length} Records`}
          </button>
        </div>
      )}
    </div>
  );
}
