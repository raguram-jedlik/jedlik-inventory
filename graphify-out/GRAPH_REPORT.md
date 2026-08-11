# Graph Report - .  (2026-08-11)

## Corpus Check
- Corpus is ~13,088 words - fits in a single context window. You may not need a graph.

## Summary
- 241 nodes · 374 edges · 38 communities detected
- Extraction: 77% EXTRACTED · 23% INFERRED · 0% AMBIGUOUS · INFERRED: 85 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_API Routes and Sheets Backend|API Routes and Sheets Backend]]
- [[_COMMUNITY_Inventory, Employees, Locations Services|Inventory, Employees, Locations Services]]
- [[_COMMUNITY_Admin and Dashboard UI|Admin and Dashboard UI]]
- [[_COMMUNITY_Alerts and Reports API|Alerts and Reports API]]
- [[_COMMUNITY_Dashboard Reporting Service|Dashboard Reporting Service]]
- [[_COMMUNITY_Admin Page Actions|Admin Page Actions]]
- [[_COMMUNITY_Client Utilities|Client Utilities]]
- [[_COMMUNITY_Employees API Cluster|Employees API Cluster]]
- [[_COMMUNITY_Scan Location Flow|Scan Location Flow]]
- [[_COMMUNITY_Date Formatting|Date Formatting]]
- [[_COMMUNITY_Google Sheets Backend|Google Sheets Backend]]
- [[_COMMUNITY_Isolated Node|Isolated Node]]
- [[_COMMUNITY_Isolated Node|Isolated Node]]
- [[_COMMUNITY_Isolated Node|Isolated Node]]
- [[_COMMUNITY_Isolated Node|Isolated Node]]
- [[_COMMUNITY_Isolated Node|Isolated Node]]
- [[_COMMUNITY_Isolated Node|Isolated Node]]
- [[_COMMUNITY_Isolated Node|Isolated Node]]
- [[_COMMUNITY_Isolated Node|Isolated Node]]
- [[_COMMUNITY_Isolated Node|Isolated Node]]
- [[_COMMUNITY_Isolated Node|Isolated Node]]
- [[_COMMUNITY_Isolated Node|Isolated Node]]
- [[_COMMUNITY_Isolated Node|Isolated Node]]
- [[_COMMUNITY_Isolated Node|Isolated Node]]
- [[_COMMUNITY_Isolated Node|Isolated Node]]
- [[_COMMUNITY_Isolated Node|Isolated Node]]
- [[_COMMUNITY_Isolated Node|Isolated Node]]
- [[_COMMUNITY_Isolated Node|Isolated Node]]
- [[_COMMUNITY_Isolated Node|Isolated Node]]
- [[_COMMUNITY_Isolated Node|Isolated Node]]
- [[_COMMUNITY_Isolated Node|Isolated Node]]
- [[_COMMUNITY_Isolated Node|Isolated Node]]
- [[_COMMUNITY_Isolated Node|Isolated Node]]
- [[_COMMUNITY_Isolated Node|Isolated Node]]
- [[_COMMUNITY_Isolated Node|Isolated Node]]
- [[_COMMUNITY_Isolated Node|Isolated Node]]
- [[_COMMUNITY_Isolated Node|Isolated Node]]
- [[_COMMUNITY_Isolated Node|Isolated Node]]

## God Nodes (most connected - your core abstractions)
1. `readSheet()` - 26 edges
2. `readSheet` - 21 edges
3. `getAllInventory()` - 11 edges
4. `SearchPage()` - 10 edges
5. `processTransaction()` - 10 edges
6. `processTransaction` - 10 edges
7. `getReportData()` - 9 edges
8. `AdminPage()` - 8 edges
9. `ScanPageInner()` - 8 edges
10. `updateCell()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `SearchPage()` --calls--> `debounce()`  [INFERRED]
  app/search/page.js → lib/utils.js
- `POST()` --calls--> `generateAllMissingQRCodes()`  [INFERRED]
  app/api/qr/route.js → lib/qr-service.js
- `GET()` --calls--> `getDashboardData()`  [INFERRED]
  app/api/dashboard/route.js → lib/dashboard-service.js
- `GET()` --calls--> `getRecentTransactions()`  [INFERRED]
  app/api/transactions/route.js → lib/sheets-service.js
- `POST()` --calls--> `processTransaction()`  [INFERRED]
  app/api/transactions/route.js → lib/transaction-service.js

## Hyperedges (group relationships)
- **Toast Notification Consumers** — page_dashboardpage, admin_page_adminpage, scan_page_scanpageinner, print_page_printpage, search_page_searchpage, reports_page_reportspage [EXTRACTED 1.00]
- **Transaction Display Surfaces** — page_dashboardpage, scan_page_scanpageinner, search_page_searchpage [INFERRED 0.85]
- **QR Code Operations** — admin_page_loadqrstatus, admin_page_generatemissingqr, print_page_loadlabels, print_page_handletprint [INFERRED 0.85]
- **Inventory transaction write flow** — transactions_post, transaction_service_processtransaction, transaction_service_acquirelock, transaction_service_releaselock, sheets_service_validateemployee, sheets_service_getlocationdetails, sheets_service_generatenextid, sheets_readsheet, sheets_batchupdate, sheets_appendrows, sheets_appendrow [EXTRACTED 0.95]
- **Dashboard KPIs and report generators** — dashboard_service_getdashboarddata, dashboard_service_getreportdata, dashboard_service_getfilteredtransactions, dashboard_service_reportinventorymovement, dashboard_service_reportemployeeusage, dashboard_service_reportmonthlyconsumption, dashboard_service_reportstockvalue, dashboard_service_reportlowstock, dashboard_service_reportfastmoving, dashboard_service_reportslowmoving, sheets_service_getallinventory, sheets_service_getalllocations, sheets_service_getrecenttransactions, sheets_readsheet [EXTRACTED 0.95]
- **QR code generation and storage flow** — qr_service_generateqrcodeurl, qr_service_getallqrdata, qr_service_generateallmissingqrcodes, qr_service_generateqrcodeforlocation, qr_service_getqrlabelsforprint, quickchart_io, sheets_readsheet, sheets_updatecell, locations_post [EXTRACTED 0.95]

## Communities (43 total, 30 thin omitted)

### Community 0 - "API Routes and Sheets Backend"
Cohesion: 0.1
Nodes (38): GET(), POST(), generateAllMissingQRCodes(), generateQRCodeForLocation(), generateQRCodeUrl(), getAllQRData(), getQRLabelsForPrint(), appendRow() (+30 more)

### Community 1 - "Inventory, Employees, Locations Services"
Cohesion: 0.07
Nodes (41): POST /api/employees handler, POST /api/employees/validate handler, Google Service Account authentication, POST /api/inventory handler, GET /api/inventory/search handler, POST /api/locations handler, generateAllMissingQRCodes, generateQRCodeForLocation (+33 more)

### Community 2 - "Admin and Dashboard UI"
Cohesion: 0.11
Nodes (22): AdminPage(), loadAlerts, DashboardPage(), useLoading(), useToast(), ConfirmModal, Inventory Status Types (In Stock / Low Stock / Out of Stock), RootLayout (+14 more)

### Community 3 - "Alerts and Reports API"
Cohesion: 0.14
Nodes (20): GET(), GET(), getDashboardData(), getFilteredTransactions(), getReportData(), reportEmployeeUsage(), reportFastMoving(), reportInventoryMovement() (+12 more)

### Community 4 - "Dashboard Reporting Service"
Cohesion: 0.13
Nodes (24): GET /api/alerts handler, GET /api/dashboard handler, getDashboardData, getFilteredTransactions, getReportData, reportEmployeeUsage, reportFastMoving, reportInventoryMovement (+16 more)

### Community 5 - "Admin Page Actions"
Cohesion: 0.16
Nodes (16): addEmployee, addItem, addLocation, generateMissingQR, loadEmployees, loadLocations, loadQRStatus, hideLoading (+8 more)

### Community 6 - "Client Utilities"
Cohesion: 0.29
Nodes (3): debounce(), formatDate(), timeAgo()

### Community 7 - "Employees API Cluster"
Cohesion: 0.5
Nodes (3): GET(), POST(), getAllEmployees()

## Knowledge Gaps
- **61 isolated node(s):** `NextConfig`, `defineConfig`, `metadata export`, `viewport export`, `loadLocations` (+56 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **30 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `readSheet()` connect `API Routes and Sheets Backend` to `Alerts and Reports API`, `Employees API Cluster`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Why does `readSheet` connect `Inventory, Employees, Locations Services` to `Dashboard Reporting Service`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Why does `processTransaction` connect `Inventory, Employees, Locations Services` to `Dashboard Reporting Service`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Are the 18 inferred relationships involving `readSheet()` (e.g. with `getDashboardData()` and `getFilteredTransactions()`) actually correct?**
  _`readSheet()` has 18 INFERRED edges - model-reasoned connections that need verification._
- **Are the 8 inferred relationships involving `getAllInventory()` (e.g. with `GET()` and `getAlerts()`) actually correct?**
  _`getAllInventory()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `SearchPage()` (e.g. with `useToast()` and `debounce()`) actually correct?**
  _`SearchPage()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Are the 7 inferred relationships involving `processTransaction()` (e.g. with `POST()` and `validateEmployee()`) actually correct?**
  _`processTransaction()` has 7 INFERRED edges - model-reasoned connections that need verification._