# Graph Report - jedlik-inventory  (2026-09-19)

## Corpus Check
- 38 files · ~22,294 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 274 nodes · 426 edges · 40 communities detected
- Extraction: 77% EXTRACTED · 22% INFERRED · 0% AMBIGUOUS · INFERRED: 95 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b9ee6f8b`
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
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
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
- [[_COMMUNITY_Community 46|Community 46]]

## God Nodes (most connected - your core abstractions)
1. `readSheet()` - 27 edges
2. `readSheet` - 21 edges
3. `processTransaction()` - 13 edges
4. `getAllInventory()` - 11 edges
5. `SearchPage()` - 10 edges
6. `processTransaction` - 10 edges
7. `ScanPageInner()` - 9 edges
8. `getReportData()` - 9 edges
9. `AdminPage()` - 8 edges
10. `useToast()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `ScanPageInner()` --calls--> `escapeHtml()`  [INFERRED]
  app/scan/page.js → lib/utils.js
- `SearchPage()` --calls--> `debounce()`  [INFERRED]
  app/search/page.js → lib/utils.js
- `GET()` --calls--> `getAllLocations()`  [INFERRED]
  app/api/locations/route.js → lib/sheets-service.js
- `POST()` --calls--> `generateAllMissingQRCodes()`  [INFERRED]
  app/api/qr/route.js → lib/qr-service.js
- `GET()` --calls--> `getDashboardData()`  [INFERRED]
  app/api/dashboard/route.js → lib/dashboard-service.js

## Hyperedges (group relationships)
- **Toast Notification Consumers** — page_dashboardpage, admin_page_adminpage, scan_page_scanpageinner, print_page_printpage, search_page_searchpage, reports_page_reportspage [EXTRACTED 1.00]
- **Transaction Display Surfaces** — page_dashboardpage, scan_page_scanpageinner, search_page_searchpage [INFERRED 0.85]
- **QR Code Operations** — admin_page_loadqrstatus, admin_page_generatemissingqr, print_page_loadlabels, print_page_handletprint [INFERRED 0.85]
- **Inventory transaction write flow** — transactions_post, transaction_service_processtransaction, transaction_service_acquirelock, transaction_service_releaselock, sheets_service_validateemployee, sheets_service_getlocationdetails, sheets_service_generatenextid, sheets_readsheet, sheets_batchupdate, sheets_appendrows, sheets_appendrow [EXTRACTED 0.95]
- **Dashboard KPIs and report generators** — dashboard_service_getdashboarddata, dashboard_service_getreportdata, dashboard_service_getfilteredtransactions, dashboard_service_reportinventorymovement, dashboard_service_reportemployeeusage, dashboard_service_reportmonthlyconsumption, dashboard_service_reportstockvalue, dashboard_service_reportlowstock, dashboard_service_reportfastmoving, dashboard_service_reportslowmoving, sheets_service_getallinventory, sheets_service_getalllocations, sheets_service_getrecenttransactions, sheets_readsheet [EXTRACTED 0.95]
- **QR code generation and storage flow** — qr_service_generateqrcodeurl, qr_service_getallqrdata, qr_service_generateallmissingqrcodes, qr_service_generateqrcodeforlocation, qr_service_getqrlabelsforprint, quickchart_io, sheets_readsheet, sheets_updatecell, locations_post [EXTRACTED 0.95]

## Communities (47 total, 31 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.1
Nodes (35): GET(), POST(), GET(), POST(), appendRow(), appendRows(), batchUpdate(), columnToLetter() (+27 more)

### Community 1 - "Community 1"
Cohesion: 0.1
Nodes (23): AdminPage(), loadAlerts, DashboardPage(), useLoading(), useToast(), ConfirmModal, Inventory Status Types (In Stock / Low Stock / Out of Stock), RootLayout (+15 more)

### Community 2 - "Community 2"
Cohesion: 0.1
Nodes (33): GET /api/alerts handler, GET /api/dashboard handler, getDashboardData, getFilteredTransactions, getReportData, reportEmployeeUsage, reportFastMoving, reportInventoryMovement (+25 more)

### Community 3 - "Community 3"
Cohesion: 0.08
Nodes (32): POST /api/employees handler, POST /api/employees/validate handler, Google Service Account authentication, POST /api/inventory handler, POST /api/locations handler, generateAllMissingQRCodes, generateQRCodeForLocation, generateQRCodeUrl (+24 more)

### Community 4 - "Community 4"
Cohesion: 0.17
Nodes (18): GET(), GET(), getDashboardData(), getFilteredTransactions(), getReportData(), reportEmployeeUsage(), reportFastMoving(), reportInventoryMovement() (+10 more)

### Community 5 - "Community 5"
Cohesion: 0.16
Nodes (16): addEmployee, addItem, addLocation, generateMissingQR, loadEmployees, loadLocations, loadQRStatus, hideLoading (+8 more)

### Community 6 - "Community 6"
Cohesion: 0.23
Nodes (10): generateAllMissingQRCodes(), generateQRCodeForLocation(), generateQRCodeUrl(), getAllQRData(), getQRLabelsForPrint(), updateCell(), GET(), POST() (+2 more)

### Community 7 - "Community 7"
Cohesion: 0.4
Nodes (7): buildEmployeeOpenHoldings(), computeOpenHoldings(), getOpenHoldingQty(), holdingKey(), parseQty(), parseTs(), validateReturnRequests()

### Community 9 - "Community 9"
Cohesion: 0.25
Nodes (4): debounce(), escapeHtml(), formatDate(), timeAgo()

## Knowledge Gaps
- **61 isolated node(s):** `NextConfig`, `defineConfig`, `metadata export`, `viewport export`, `loadLocations` (+56 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **31 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `readSheet()` connect `Community 0` to `Community 4`, `Community 6`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Why does `readSheet` connect `Community 2` to `Community 3`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Why does `getAllInventory()` connect `Community 4` to `Community 0`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Are the 19 inferred relationships involving `readSheet()` (e.g. with `getDashboardData()` and `getFilteredTransactions()`) actually correct?**
  _`readSheet()` has 19 INFERRED edges - model-reasoned connections that need verification._
- **Are the 10 inferred relationships involving `processTransaction()` (e.g. with `POST()` and `validateEmployee()`) actually correct?**
  _`processTransaction()` has 10 INFERRED edges - model-reasoned connections that need verification._
- **Are the 8 inferred relationships involving `getAllInventory()` (e.g. with `GET()` and `getAlerts()`) actually correct?**
  _`getAllInventory()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `SearchPage()` (e.g. with `useToast()` and `debounce()`) actually correct?**
  _`SearchPage()` has 4 INFERRED edges - model-reasoned connections that need verification._