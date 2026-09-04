# Graph Report - jedlik-inventory  (2026-09-04)

## Corpus Check
- 34 files · ~19,050 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 258 nodes · 391 edges · 39 communities detected
- Extraction: 78% EXTRACTED · 22% INFERRED · 0% AMBIGUOUS · INFERRED: 86 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `59dd8422`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]

## God Nodes (most connected - your core abstractions)
1. `readSheet()` - 26 edges
2. `readSheet` - 21 edges
3. `getAllInventory()` - 11 edges
4. `SearchPage()` - 10 edges
5. `processTransaction()` - 10 edges
6. `processTransaction` - 10 edges
7. `ScanPageInner()` - 9 edges
8. `getReportData()` - 9 edges
9. `AdminPage()` - 8 edges
10. `updateCell()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `ScanPageInner()` --calls--> `escapeHtml()`  [INFERRED]
  app/scan/page.js → lib/utils.js
- `SearchPage()` --calls--> `debounce()`  [INFERRED]
  app/search/page.js → lib/utils.js
- `POST()` --calls--> `generateAllMissingQRCodes()`  [INFERRED]
  app/api/qr/route.js → lib/qr-service.js
- `GET()` --calls--> `getDashboardData()`  [INFERRED]
  app/api/dashboard/route.js → lib/dashboard-service.js
- `GET()` --calls--> `getRecentTransactions()`  [INFERRED]
  app/api/transactions/route.js → lib/sheets-service.js

## Hyperedges (group relationships)
- **Toast Notification Consumers** — page_dashboardpage, admin_page_adminpage, scan_page_scanpageinner, print_page_printpage, search_page_searchpage, reports_page_reportspage [EXTRACTED 1.00]
- **Transaction Display Surfaces** — page_dashboardpage, scan_page_scanpageinner, search_page_searchpage [INFERRED 0.85]
- **QR Code Operations** — admin_page_loadqrstatus, admin_page_generatemissingqr, print_page_loadlabels, print_page_handletprint [INFERRED 0.85]
- **Inventory transaction write flow** — transactions_post, transaction_service_processtransaction, transaction_service_acquirelock, transaction_service_releaselock, sheets_service_validateemployee, sheets_service_getlocationdetails, sheets_service_generatenextid, sheets_readsheet, sheets_batchupdate, sheets_appendrows, sheets_appendrow [EXTRACTED 0.95]
- **Dashboard KPIs and report generators** — dashboard_service_getdashboarddata, dashboard_service_getreportdata, dashboard_service_getfilteredtransactions, dashboard_service_reportinventorymovement, dashboard_service_reportemployeeusage, dashboard_service_reportmonthlyconsumption, dashboard_service_reportstockvalue, dashboard_service_reportlowstock, dashboard_service_reportfastmoving, dashboard_service_reportslowmoving, sheets_service_getallinventory, sheets_service_getalllocations, sheets_service_getrecenttransactions, sheets_readsheet [EXTRACTED 0.95]
- **QR code generation and storage flow** — qr_service_generateqrcodeurl, qr_service_getallqrdata, qr_service_generateallmissingqrcodes, qr_service_generateqrcodeforlocation, qr_service_getqrlabelsforprint, quickchart_io, sheets_readsheet, sheets_updatecell, locations_post [EXTRACTED 0.95]

## Communities (46 total, 31 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (56): GET /api/alerts handler, GET /api/dashboard handler, getDashboardData, reportLowStock, GET /api/employees handler, POST /api/employees handler, POST /api/employees/validate handler, Google Service Account authentication (+48 more)

### Community 1 - "Community 1"
Cohesion: 0.09
Nodes (41): GET(), POST(), GET(), POST(), generateAllMissingQRCodes(), generateQRCodeForLocation(), generateQRCodeUrl(), getAllQRData() (+33 more)

### Community 2 - "Community 2"
Cohesion: 0.12
Nodes (18): AdminPage(), loadAlerts, DashboardPage(), useLoading(), useToast(), ConfirmModal, Inventory Status Types (In Stock / Low Stock / Out of Stock), formatCurrency() (+10 more)

### Community 3 - "Community 3"
Cohesion: 0.14
Nodes (20): GET(), GET(), getDashboardData(), getFilteredTransactions(), getReportData(), reportEmployeeUsage(), reportFastMoving(), reportInventoryMovement() (+12 more)

### Community 4 - "Community 4"
Cohesion: 0.16
Nodes (16): addEmployee, addItem, addLocation, generateMissingQR, loadEmployees, loadLocations, loadQRStatus, hideLoading (+8 more)

### Community 5 - "Community 5"
Cohesion: 0.25
Nodes (4): debounce(), escapeHtml(), formatDate(), timeAgo()

### Community 6 - "Community 6"
Cohesion: 0.33
Nodes (9): getFilteredTransactions, getReportData, reportEmployeeUsage, reportFastMoving, reportInventoryMovement, reportMonthlyConsumption, reportSlowMoving, reportStockValue (+1 more)

### Community 9 - "Community 9"
Cohesion: 0.5
Nodes (4): RootLayout, LoadingProvider, Provider Nesting Pattern (Toast > Loading > Content + Navbar), ToastProvider

## Knowledge Gaps
- **61 isolated node(s):** `NextConfig`, `defineConfig`, `metadata export`, `viewport export`, `loadLocations` (+56 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **31 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `readSheet()` connect `Community 1` to `Community 3`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Why does `readSheet` connect `Community 0` to `Community 6`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Are the 18 inferred relationships involving `readSheet()` (e.g. with `getDashboardData()` and `getFilteredTransactions()`) actually correct?**
  _`readSheet()` has 18 INFERRED edges - model-reasoned connections that need verification._
- **Are the 8 inferred relationships involving `getAllInventory()` (e.g. with `GET()` and `getAlerts()`) actually correct?**
  _`getAllInventory()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `SearchPage()` (e.g. with `useToast()` and `debounce()`) actually correct?**
  _`SearchPage()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Are the 7 inferred relationships involving `processTransaction()` (e.g. with `POST()` and `validateEmployee()`) actually correct?**
  _`processTransaction()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **What connects `NextConfig`, `defineConfig`, `metadata export` to the rest of the system?**
  _61 weakly-connected nodes found - possible documentation gaps or missing edges._