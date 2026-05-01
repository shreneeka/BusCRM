# Accounting Module Implementation TODO

## Phase 1: Database Schema (SQL)
- [ ] 01_accounting_categories.sql - Categories table
- [ ] 02_accounting_accounts.sql - Accounts table (extend existing accounts or create new)
- [ ] 03_accounting_entries.sql - Entries table (income + expense unified)

## Phase 2: Server Actions (lib/actions)
- [ ] accounting.actions.ts - All CRUD operations for accounting module

## Phase 3: UI Components
- [ ] accounting/AccountingTabs.tsx - Tab main component
- [ ] accounting/EntriesList.tsx - Entries list with filters
- [ ] accounting/AccountsList.tsx - Accounts list with balance
- [ ] accounting/CategoriesList.tsx - Categories list
- [ ] accounting/EntryForm.tsx - Add income/expense modal
- [ ] accounting/AccountForm.tsx - Add account modal
- [ ] accounting/CategoryForm.tsx - Add category modal

## Phase 4: Pages
- [ ] app/(dashboard)/accounting/page.tsx - Main accounting page

## Phase 5: Sidebar Integration
- [ ] Update sidebar to add Accounting nav item
