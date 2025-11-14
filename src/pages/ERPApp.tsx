import { Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { ERPLayout } from '@/components/ERPLayout'

// ERP Dashboard
import { ERPDashboardPage } from '@/pages/erp/ERPDashboardPage'

// Inventory Pages
import { InventoryDashboardPage } from '@/pages/erp/InventoryDashboardPage'
import { ItemsPage } from '@/pages/erp/ItemsPage'
import { StockRegisterPage } from '@/pages/erp/StockRegisterPage'
import { StockTransferPage } from '@/pages/erp/StockTransferPage'
import { StockAdjustmentPage } from '@/pages/erp/StockAdjustmentPage'
import { BrandMasterPage } from '@/pages/erp/BrandMasterPage'
import { ItemCategoryPage } from '@/pages/erp/ItemCategoryPage'
import { UnitMasterPage } from '@/pages/erp/UnitMasterPage'
import { ItemTypeMasterPage } from '@/pages/erp/ItemTypeMasterPage'
import { HSCodePage } from '@/pages/erp/HSCodePage'
import { OpeningStockPage } from '@/pages/erp/OpeningStockPage'

// Procurement Pages
import { ProcurementDashboardPage } from '@/pages/erp/ProcurementDashboardPage'
import { SuppliersPage } from '@/pages/erp/SuppliersPage'
import { PurchaseRequisitionPage } from '@/pages/erp/PurchaseRequisitionPage'
import { PurchaseQuotationPage } from '@/pages/erp/PurchaseQuotationPage'
import { PurchaseOrderPage } from '@/pages/erp/PurchaseOrderPage'
import { GRNPage } from '@/pages/erp/GRNPage'
import { PurchaseInvoicePage } from '@/pages/erp/PurchaseInvoicePage'
import { PurchaseComparisonPage } from '@/pages/erp/PurchaseComparisonPage'
import { PurchaseReturnPage } from '@/pages/erp/PurchaseReturnPage'

// Sales Pages
import { SalesDashboardPage } from '@/pages/erp/SalesDashboardPage'
import { CustomersPage } from '@/pages/erp/CustomersPage'
import { SalesEnquiryPage } from '@/pages/erp/SalesEnquiryPage'
import { SalesQuotationPage } from '@/pages/erp/SalesQuotationPage'
import { SalesOrderPage } from '@/pages/erp/SalesOrderPage'
import { DeliveryOrderPage } from '@/pages/erp/DeliveryOrderPage'
import { SalesInvoicePage } from '@/pages/erp/SalesInvoicePage'
import { CashSalesPage } from '@/pages/erp/CashSalesPage'
import { ExportSalesPage } from '@/pages/erp/ExportSalesPage'
import { CashSalesReturnPage } from '@/pages/erp/CashSalesReturnPage'
import { CreditSalesPage } from '@/pages/erp/CreditSalesPage'
import { CreditSalesReturnPage } from '@/pages/erp/CreditSalesReturnPage'

// Financials Pages
import { FinancialsDashboardPage } from '@/pages/erp/FinancialsDashboardPage'
import { ChartOfAccountsPage } from '@/pages/erp/ChartOfAccountsPage'
import { JournalVoucherPage } from '@/pages/erp/JournalVoucherPage'
import { BankPaymentPage } from '@/pages/erp/BankPaymentPage'
import { ReceiptPage } from '@/pages/erp/ReceiptPage'
import { BankReconciliationPage } from '@/pages/erp/BankReconciliationPage'
import { TrialBalancePage } from '@/pages/erp/TrialBalancePage'
import { BalanceSheetPage } from '@/pages/erp/BalanceSheetPage'
import { ProfitLossPage } from '@/pages/erp/ProfitLossPage'
import { CashDepositPage } from '@/pages/erp/CashDepositPage'
import { CashPaymentPage } from '@/pages/erp/CashPaymentPage'
import { ChequeDepositPage } from '@/pages/erp/ChequeDepositPage'
import { PDCManagementPage } from '@/pages/erp/PDCManagementPage'
import { CashFlowStatementPage } from '@/pages/erp/CashFlowStatementPage'

// HR & Payroll Pages
import { HRDashboardPage } from '@/pages/erp/HRDashboardPage'
import { EmployeesPage } from '@/pages/erp/EmployeesPage'
import { AttendancePage } from '@/pages/erp/AttendancePage'
import { LeaveRequestPage } from '@/pages/erp/LeaveRequestPage'
import { PayrollPage } from '@/pages/erp/PayrollPage'
import { AdvanceLoanPage } from '@/pages/erp/AdvanceLoanPage'
import { DeductionPage } from '@/pages/erp/DeductionPage'
import { LeaveCategoryPage } from '@/pages/erp/LeaveCategoryPage'
import { LeavePolicyPage } from '@/pages/erp/LeavePolicyPage'
import { OtherRequestPage } from '@/pages/erp/OtherRequestPage'
import { SeasonPage } from '@/pages/erp/SeasonPage'
import { ShiftManagementPage } from '@/pages/erp/ShiftManagementPage'

// Project Pages
import { ProjectsPage } from '@/pages/erp/ProjectsPage'

// Control Panel Pages
import { ControlPanelPage } from '@/pages/erp/ControlPanelPage'
import { BranchesPage } from '@/pages/erp/BranchesPage'
import { DepartmentsPage } from '@/pages/erp/DepartmentsPage'
import { UsersPage as ERPUsersPage } from '@/pages/erp/UsersPage'
import { RolesPage } from '@/pages/erp/RolesPage'
import { SettingsPage as ERPSettingsPage } from '@/pages/erp/SettingsPage'
import { AccountSettingsPage } from '@/pages/erp/AccountSettingsPage'
import { AuthorizationPage } from '@/pages/erp/AuthorizationPage'
import { CurrencyPage } from '@/pages/erp/CurrencyPage'
import { ExchangeRatePage } from '@/pages/erp/ExchangeRatePage'
import { FinancialYearPage } from '@/pages/erp/FinancialYearPage'
import { MasterSettingsPage } from '@/pages/erp/MasterSettingsPage'
import { RoleAssignmentPage } from '@/pages/erp/RoleAssignmentPage'

// Reports Pages
import { ReportsPage } from '@/pages/erp/ReportsPage'

// Tax Pages
import { TaxMasterPage } from '@/pages/erp/TaxMasterPage'
import { SalaryTaxPage } from '@/pages/erp/SalaryTaxPage'

function ERPApp() {
  return (
    <Routes>
      <Route path="" element={<ProtectedRoute><ERPLayout /></ProtectedRoute>}>
        <Route index element={<ERPDashboardPage />} />
        <Route path="dashboard" element={<ERPDashboardPage />} />
        
        {/* Inventory Routes */}
        <Route path="inventory" element={<InventoryDashboardPage />} />
            <Route path="inventory/items" element={<ItemsPage />} />
            <Route path="inventory/brand-master" element={<BrandMasterPage />} />
            <Route path="inventory/item-category" element={<ItemCategoryPage />} />
            <Route path="inventory/item-type" element={<ItemTypeMasterPage />} />
            <Route path="inventory/unit-master" element={<UnitMasterPage />} />
            <Route path="inventory/hs-code" element={<HSCodePage />} />
            <Route path="inventory/opening-stock" element={<OpeningStockPage />} />
            <Route path="inventory/stock-register" element={<StockRegisterPage />} />
            <Route path="inventory/stock-transfer" element={<StockTransferPage />} />
            <Route path="inventory/stock-adjustment" element={<StockAdjustmentPage />} />
            
            {/* Procurement Routes */}
            <Route path="procurement" element={<ProcurementDashboardPage />} />
            <Route path="procurement/suppliers" element={<SuppliersPage />} />
            <Route path="procurement/purchase-requisition" element={<PurchaseRequisitionPage />} />
            <Route path="procurement/purchase-quotation" element={<PurchaseQuotationPage />} />
            <Route path="procurement/purchase-order" element={<PurchaseOrderPage />} />
            <Route path="procurement/purchase-comparison" element={<PurchaseComparisonPage />} />
            <Route path="procurement/grn" element={<GRNPage />} />
            <Route path="procurement/purchase-invoice" element={<PurchaseInvoicePage />} />
            <Route path="procurement/purchase-return" element={<PurchaseReturnPage />} />
            
            {/* Sales Routes */}
            <Route path="sales" element={<SalesDashboardPage />} />
            <Route path="sales/customers" element={<CustomersPage />} />
            <Route path="sales/enquiry" element={<SalesEnquiryPage />} />
            <Route path="sales/quotation" element={<SalesQuotationPage />} />
            <Route path="sales/order" element={<SalesOrderPage />} />
            <Route path="sales/delivery" element={<DeliveryOrderPage />} />
            <Route path="sales/invoice" element={<SalesInvoicePage />} />
            <Route path="sales/cash-sales" element={<CashSalesPage />} />
            <Route path="sales/cash-sales-return" element={<CashSalesReturnPage />} />
            <Route path="sales/credit-sales" element={<CreditSalesPage />} />
            <Route path="sales/credit-sales-return" element={<CreditSalesReturnPage />} />
            <Route path="sales/export" element={<ExportSalesPage />} />
            
            {/* Financials Routes */}
            <Route path="financials" element={<FinancialsDashboardPage />} />
            <Route path="financials/chart-of-accounts" element={<ChartOfAccountsPage />} />
            <Route path="financials/journal-voucher" element={<JournalVoucherPage />} />
            <Route path="financials/bank-payment" element={<BankPaymentPage />} />
            <Route path="financials/cash-deposit" element={<CashDepositPage />} />
            <Route path="financials/cash-payment" element={<CashPaymentPage />} />
            <Route path="financials/cheque-deposit" element={<ChequeDepositPage />} />
            <Route path="financials/pdc-management" element={<PDCManagementPage />} />
            <Route path="financials/receipt" element={<ReceiptPage />} />
            <Route path="financials/bank-reconciliation" element={<BankReconciliationPage />} />
            <Route path="financials/cash-flow" element={<CashFlowStatementPage />} />
            <Route path="financials/trial-balance" element={<TrialBalancePage />} />
            <Route path="financials/balance-sheet" element={<BalanceSheetPage />} />
            <Route path="financials/profit-loss" element={<ProfitLossPage />} />
            
            {/* HR & Payroll Routes */}
            <Route path="hr" element={<HRDashboardPage />} />
            <Route path="hr/employees" element={<EmployeesPage />} />
            <Route path="hr/attendance" element={<AttendancePage />} />
            <Route path="hr/leave" element={<LeaveRequestPage />} />
            <Route path="hr/payroll" element={<PayrollPage />} />
            <Route path="hr/advance-loan" element={<AdvanceLoanPage />} />
            <Route path="hr/deduction" element={<DeductionPage />} />
            <Route path="hr/leave-category" element={<LeaveCategoryPage />} />
            <Route path="hr/leave-policy" element={<LeavePolicyPage />} />
            <Route path="hr/other-request" element={<OtherRequestPage />} />
            <Route path="hr/season" element={<SeasonPage />} />
            <Route path="hr/shift" element={<ShiftManagementPage />} />
            
            {/* Project Routes */}
            <Route path="projects" element={<ProjectsPage />} />
            
            {/* Control Panel Routes */}
            <Route path="control-panel" element={<ControlPanelPage />} />
            <Route path="control-panel/branches" element={<BranchesPage />} />
            <Route path="control-panel/departments" element={<DepartmentsPage />} />
            <Route path="control-panel/users" element={<ERPUsersPage />} />
            <Route path="control-panel/roles" element={<RolesPage />} />
            <Route path="control-panel/settings" element={<ERPSettingsPage />} />
            <Route path="control-panel/account-settings" element={<AccountSettingsPage />} />
            <Route path="control-panel/authorization" element={<AuthorizationPage />} />
            <Route path="control-panel/currency" element={<CurrencyPage />} />
            <Route path="control-panel/exchange-rate" element={<ExchangeRatePage />} />
            <Route path="control-panel/financial-year" element={<FinancialYearPage />} />
            <Route path="control-panel/master-settings" element={<MasterSettingsPage />} />
            <Route path="control-panel/role-assignment" element={<RoleAssignmentPage />} />
            
            {/* Reports Routes */}
            <Route path="reports" element={<ReportsPage />} />
            
        {/* Tax Routes */}
        <Route path="tax" element={<TaxMasterPage />} />
        <Route path="tax/master" element={<TaxMasterPage />} />
        <Route path="tax/salary-tax" element={<SalaryTaxPage />} />
      </Route>
    </Routes>
  )
}

export default ERPApp


