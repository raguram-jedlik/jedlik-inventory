---
type: "query"
date: "2026-08-11T08:55:54.578845+00:00"
question: "Why does readSheet() bridge API Routes and Sheets Backend, Alerts and Reports API, and Employees API Cluster?"
contributor: "graphify"
source_nodes: ["readSheet", "readSheet()"]
---

# Q: Why does readSheet() bridge API Routes and Sheets Backend, Alerts and Reports API, and Employees API Cluster?

## Answer

readSheet() (lib/sheets.js L42) is the single low-level Google Sheets reader in the system. It returns {headers, rows} from any named sheet tab via the authenticated Sheets API client. Every domain service that needs to read data must call it directly or via sheets-service wrappers: dashboard-service (getDashboardData, getFilteredTransactions, reportLowStock, reportFastMoving, reportMonthlyConsumption, reportStockValue, reportEmployeeUsage, reportInventoryMovement), qr-service (getAllQRData, generateAllMissingQRCodes, generateQRCodeForLocation, getQRLabelsForPrint), transaction-service (processTransaction, getItemTransactionHistory, getLocationTransactionHistory), and sheets-service (getInventoryByLocation, getLocationDetails, getAllLocations, getAllEmployees, getRecentTransactions, etc.). Its high betweenness (0.051) reflects that it's the chokepoint for Sheets reads - shortest paths between any two data-reading services pass through it. The 18 INFERRED call edges from readSheet() to those services are mostly redundant with EXTRACTED imports of lib/sheets.js - they confirm what AST already shows.

## Source Nodes

- readSheet
- readSheet()