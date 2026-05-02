# Organization Module - Complete Documentation

## Overview
The Organization Module provides comprehensive travel ticket management with operator settlements, commission tracking, and accounting integration.

## Features Implemented

### 1. Database Schema Enhancements
- **Operators Table**: Store operator information with commission percentages
- **Operator Settlements Table**: Track all operator payments and settlements
- **Enhanced Tickets Table**: Added operator_id for ticket-operator relationship
- **Validation Triggers**: Ensure data integrity and calculation accuracy
- **Performance Indexes**: Optimized queries for better performance
- **Summary Views**: Pre-built views for reporting and analytics

### 2. Operator Management
- **CRUD Operations**: Create, read, update, delete operators
- **Commission Setup**: Fixed percentage commission per operator
- **Status Management**: Active/inactive operator status
- **Operator Statistics**: Track tickets, amounts, and settlements per operator
- **Mobile Number Validation**: Ensure unique and valid contact information

### 3. Ticket Booking with Operator Assignment
- **Operator Selection**: Assign operators during ticket booking
- **Automatic Commission Calculation**: Based on operator's commission percentage
- **Accounting Integration**: Full amount added to income on booking
- **Account Selection**: Choose payment account (Cash/UPI)
- **Customer Management**: Auto-create/update customer records

### 4. Settlement Workflow
- **Pending Settlements**: View all booked tickets awaiting settlement
- **Settlement Calculation**: 
  - Total Amount = Sum of ticket amounts
  - Commission Amount = Total Amount × Commission %
  - Operator Payable = Total Amount - Commission Amount
- **Payment Processing**: Record operator payments with timestamps
- **Account Updates**: Deduct operator payable from account balance
- **Commission Tracking**: Retain commission as system income

### 5. Accounting Integration
- **Income Entries**: Full ticket amount recorded as income on booking
- **Commission Income**: Commission amount recorded separately on settlement
- **Account Balance Updates**: Real-time balance adjustments
- **Transaction History**: Complete audit trail of all financial movements

## Workflow Summary

### Complete Ticket Booking & Settlement Flow:
1. **Ticket Booking**
   - Select operator (if applicable)
   - Enter ticket details
   - Choose payment account
   - System adds full amount to income
   - Updates account balance

2. **Settlement Calculation**
   - System identifies pending tickets per operator
   - Calculates commission based on operator percentage
   - Determines operator payable amount

3. **Operator Payment**
   - Process settlement for individual or batch tickets
   - Record payment timestamp
   - Create commission income entry
   - Deduct operator payable from account balance

4. **Final State**
   - Commission retained as system income
   - Operator payment completed
   - Ticket status updated to "Settled"

## Key Rules & Validation

### Business Rules:
- Commission is fixed and auto-calculated based on operator percentage
- No manual edits allowed in settlement calculations
- Only operator payable amount is deducted from income
- Commission is automatically retained as system income
- Proper settlement records with timestamps are maintained

### Data Validation:
- Commission percentage must be between 0-100%
- Mobile numbers must be at least 10 digits
- Ticket amounts must be positive
- Settlement calculations are mathematically validated
- Account balances cannot go negative

## API Endpoints & Actions

### Operator Actions (`/lib/actions/operators.actions.ts`):
- `createOperator()` - Create new operator
- `getAllOperators()` - Get all operators
- `getOperators()` - Get active operators only
- `updateOperator()` - Update operator details
- `deleteOperator()` - Soft delete (deactivate) operator
- `getOperatorById()` - Get operator by ID
- `getOperatorSummary()` - Get operator statistics
- `getOperatorsWithTicketCounts()` - Get operators with ticket data
- `toggleOperatorStatus()` - Activate/deactivate operator

### Settlement Actions (`/lib/actions/settlement.actions.ts`):
- `getAllSettlements()` - Get all settlement records
- `getPendingSettlements()` - Get pending ticket settlements
- `getSettlementsByOperator()` - Get settlements by operator
- `getOperatorSummary()` - Get operator financial summary
- `settleOperatorPayment()` - Process individual ticket settlement
- `batchSettleOperatorPayment()` - Process bulk operator settlements

### Ticket Actions (`/lib/actions/ticket.actions.ts`):
- Enhanced `createTicket()` with operator assignment
- `getOperators()` - Get operators for ticket booking
- Existing ticket management functions

## UI Components

### Settlement Components:
- **SettlementList** - Display completed settlements with filters
- **PendingSettlements** - Show pending tickets with settlement actions
- **SettlePaymentModal** - Process individual ticket settlements

### Pages:
- **Organization Page** (`/organization`) - Main organization hub
- **Operators Page** (`/organization/operators`) - Operator management
- **Settlements Page** (`/organization/settlements`) - Settlement management

## Database Schema

### Key Tables:
```sql
-- Operators
CREATE TABLE operators (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  person_name TEXT NOT NULL,
  mobile_number TEXT UNIQUE NOT NULL,
  commission_percentage DECIMAL DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Operator Settlements
CREATE TABLE operator_settlements (
  id UUID PRIMARY KEY,
  ticket_id UUID REFERENCES tickets(id),
  operator_name TEXT NOT NULL,
  mobile_number TEXT,
  total_amount DECIMAL NOT NULL,
  commission_percentage DECIMAL NOT NULL,
  commission_amount DECIMAL NOT NULL,
  operator_payable DECIMAL NOT NULL,
  is_paid BOOLEAN DEFAULT false,
  paid_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Enhanced Tickets (operator_id added)
ALTER TABLE tickets ADD COLUMN operator_id UUID REFERENCES operators(id);
```

### Views:
```sql
-- Operator Summary View
CREATE VIEW operator_summary AS
SELECT 
  o.id, o.name, o.person_name, o.mobile_number,
  o.commission_percentage, o.is_active,
  COUNT(t.id) as total_tickets,
  COALESCE(SUM(t.amount), 0) as total_amount,
  COALESCE(SUM(os.commission_amount), 0) as total_commission,
  COALESCE(SUM(os.operator_payable), 0) as total_paid
FROM operators o
LEFT JOIN tickets t ON o.id = t.operator_id
LEFT JOIN operator_settlements os ON o.name = os.operator_name
GROUP BY o.id;

-- Settlement Summary View
CREATE VIEW settlement_summary AS
SELECT 
  os.*, t.ticket_number, t.passenger_name, 
  t.journey_date, t.status as ticket_status
FROM operator_settlements os
LEFT JOIN tickets t ON os.ticket_id = t.id;
```

## Testing Checklist

### Manual Testing Steps:
1. **Operator Management**
   - [ ] Create new operator with commission percentage
   - [ ] Update operator details
   - [ ] Deactivate/reactivate operator
   - [ ] View operator statistics

2. **Ticket Booking**
   - [ ] Book ticket with operator assignment
   - [ ] Verify income entry creation
   - [ ] Check account balance update
   - [ ] Confirm customer record creation

3. **Settlement Process**
   - [ ] View pending settlements
   - [ ] Process individual settlement
   - [ ] Verify calculation accuracy
   - [ ] Check commission income entry
   - [ ] Confirm account balance deduction
   - [ ] Verify ticket status update

4. **Reporting**
   - [ ] View settlement history
   - [ ] Check operator summary
   - [ ] Verify financial totals
   - [ ] Test search and filters

## Migration Files
- `14_organization_module_enhancements.sql` - Database schema enhancements

## Notes
- All calculations are server-side validated
- Commission is automatically retained as income
- Operator payments are deducted from account balances
- Complete audit trail maintained
- Real-time balance updates
- Comprehensive error handling and validation
