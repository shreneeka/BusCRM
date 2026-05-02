# Organization Module Implementation TODO

## Status: In Progress

### Completed ✅
1. ✅ Database tables (operators, operator_settlements) with commission_percentage
2. ✅ Operator CRUD actions (create, read, update, delete)
3. ✅ OperatingList component with commission display
4. ✅ OperatorsPage with Add/Edit modals
5. ✅ TicketBookingForm with operator selection

### Pending - Settlement Module

#### Priority 1: Settlement UI
- [ ] Create settlement list component to show pending/paid settlements
- [ ] Create settle payment modal
- [ ] Add "Settlements" tab to organization page

#### Priority 2: Settlement Logic
- [ ] View tickets by operator with pending settlement
- [ ] Calculate: Total Amount, Commission %, Commission Amount, Operator Payable
- [ ] Record payment with timestamp

#### Priority 3: Accounting Integration
- [ ] Deduct operator payable from account on settlement
- [ ] Track final income (after commission retained)

### Implementation Files:
- lib/actions/settlement.actions.ts - New file for settlement actions
- app/(dashboard)/organization/settlements/page.tsx - Settlement list page
- components/organization/SettlementList.tsx - Settlement table
- components/organization/SettlePaymentModal.tsx - Modal to pay operator
