-- Missing Features and Gaps - Additional Tables and Functions
-- Run after 002_erp_schema.sql and 003_erp_rls_policies.sql

-- ============================================
-- FINANCIALS - MISSING FEATURES
-- ============================================

-- External Bill Matching
CREATE TABLE IF NOT EXISTS public.external_bill_matching (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    match_no TEXT NOT NULL,
    purchase_invoice_id UUID REFERENCES public.purchase_invoices(id),
    supplier_bill_no TEXT,
    bill_date DATE,
    bill_amount DECIMAL(15,2) NOT NULL,
    matched_amount DECIMAL(15,2) DEFAULT 0,
    difference_amount DECIMAL(15,2) DEFAULT 0,
    status TEXT DEFAULT 'pending', -- 'pending', 'matched', 'partial', 'rejected'
    matched_by UUID REFERENCES auth.users(id),
    matched_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, match_no)
);

-- PDC Discounting
CREATE TABLE IF NOT EXISTS public.pdc_discounting (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    pdc_id UUID NOT NULL REFERENCES public.pdc_cheques(id),
    discount_date DATE NOT NULL,
    discount_amount DECIMAL(15,2) NOT NULL,
    discount_rate DECIMAL(5,2) NOT NULL,
    net_amount DECIMAL(15,2) NOT NULL,
    bank_account_id UUID REFERENCES public.chart_of_accounts(id),
    status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'cancelled'
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bank Status Query (for tracking bank account status)
CREATE TABLE IF NOT EXISTS public.bank_status_queries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.chart_of_accounts(id),
    query_date DATE NOT NULL,
    opening_balance DECIMAL(15,2) NOT NULL,
    closing_balance DECIMAL(15,2) NOT NULL,
    cleared_balance DECIMAL(15,2) NOT NULL,
    uncleared_balance DECIMAL(15,2) NOT NULL,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Non-Stock Items (for services and non-inventory items)
CREATE TABLE IF NOT EXISTS public.non_stock_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    item_code TEXT NOT NULL,
    item_name TEXT NOT NULL,
    item_type TEXT NOT NULL, -- 'service', 'expense', 'income', 'other'
    account_id UUID REFERENCES public.chart_of_accounts(id),
    unit_price DECIMAL(15,2) DEFAULT 0,
    tax_percent DECIMAL(5,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, item_code)
);

-- Cash Flow Statement Categories
CREATE TABLE IF NOT EXISTS public.cash_flow_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    category_name TEXT NOT NULL,
    category_type TEXT NOT NULL, -- 'operating', 'investing', 'financing'
    parent_id UUID REFERENCES public.cash_flow_categories(id),
    account_id UUID REFERENCES public.chart_of_accounts(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cash Flow Statement Entries
CREATE TABLE IF NOT EXISTS public.cash_flow_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.cash_flow_categories(id),
    entry_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    flow_type TEXT NOT NULL, -- 'inflow', 'outflow'
    reference_type TEXT,
    reference_id UUID,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ratio Analysis Configuration
CREATE TABLE IF NOT EXISTS public.ratio_analysis_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    ratio_name TEXT NOT NULL,
    ratio_type TEXT NOT NULL, -- 'liquidity', 'profitability', 'efficiency', 'leverage'
    formula TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ratio Analysis Results
CREATE TABLE IF NOT EXISTS public.ratio_analysis_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    ratio_id UUID NOT NULL REFERENCES public.ratio_analysis_config(id),
    calculation_date DATE NOT NULL,
    ratio_value DECIMAL(15,4) NOT NULL,
    benchmark_value DECIMAL(15,4),
    status TEXT, -- 'good', 'warning', 'critical'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Daybook (Daily transaction summary)
CREATE TABLE IF NOT EXISTS public.daybook (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL,
    account_id UUID NOT NULL REFERENCES public.chart_of_accounts(id),
    debit_amount DECIMAL(15,2) DEFAULT 0,
    credit_amount DECIMAL(15,2) DEFAULT 0,
    balance DECIMAL(15,2) DEFAULT 0,
    transaction_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, entry_date, account_id)
);

-- Bank Book (Bank account transaction summary)
CREATE TABLE IF NOT EXISTS public.bank_book (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.chart_of_accounts(id),
    entry_date DATE NOT NULL,
    opening_balance DECIMAL(15,2) NOT NULL,
    debit_amount DECIMAL(15,2) DEFAULT 0,
    credit_amount DECIMAL(15,2) DEFAULT 0,
    closing_balance DECIMAL(15,2) NOT NULL,
    transaction_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, account_id, entry_date)
);

-- Issued Cheques Listing
CREATE TABLE IF NOT EXISTS public.issued_cheques (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    cheque_no TEXT NOT NULL,
    account_id UUID NOT NULL REFERENCES public.chart_of_accounts(id),
    cheque_date DATE NOT NULL,
    payee_name TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    status TEXT DEFAULT 'issued', -- 'issued', 'cleared', 'bounced', 'cancelled', 'stopped'
    payment_id UUID REFERENCES public.bank_payments(id),
    cleared_date DATE,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, cheque_no)
);

-- Receivables Summary
CREATE TABLE IF NOT EXISTS public.receivables_summary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id),
    as_on_date DATE NOT NULL,
    total_invoiced DECIMAL(15,2) DEFAULT 0,
    total_received DECIMAL(15,2) DEFAULT 0,
    total_advance DECIMAL(15,2) DEFAULT 0,
    balance_amount DECIMAL(15,2) DEFAULT 0,
    overdue_amount DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, customer_id, as_on_date)
);

-- Payables Summary
CREATE TABLE IF NOT EXISTS public.payables_summary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
    as_on_date DATE NOT NULL,
    total_invoiced DECIMAL(15,2) DEFAULT 0,
    total_paid DECIMAL(15,2) DEFAULT 0,
    total_advance DECIMAL(15,2) DEFAULT 0,
    balance_amount DECIMAL(15,2) DEFAULT 0,
    overdue_amount DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, supplier_id, as_on_date)
);

-- Ledger Query Cache (for performance)
CREATE TABLE IF NOT EXISTS public.ledger_query_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.chart_of_accounts(id),
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    opening_balance DECIMAL(15,2) DEFAULT 0,
    total_debit DECIMAL(15,2) DEFAULT 0,
    total_credit DECIMAL(15,2) DEFAULT 0,
    closing_balance DECIMAL(15,2) DEFAULT 0,
    transaction_count INTEGER DEFAULT 0,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, account_id, from_date, to_date)
);

-- Transaction Type Wise Ledger Values
CREATE TABLE IF NOT EXISTS public.transaction_type_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.chart_of_accounts(id),
    transaction_type TEXT NOT NULL, -- 'purchase', 'sale', 'payment', 'receipt', 'journal', etc.
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    total_debit DECIMAL(15,2) DEFAULT 0,
    total_credit DECIMAL(15,2) DEFAULT 0,
    transaction_count INTEGER DEFAULT 0,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, account_id, transaction_type, from_date, to_date)
);

-- ============================================
-- INVENTORY - MISSING FEATURES
-- ============================================

-- Goods Conversions (BOM - Bill of Materials)
CREATE TABLE IF NOT EXISTS public.goods_conversions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    conversion_no TEXT NOT NULL,
    from_item_id UUID NOT NULL REFERENCES public.items(id),
    to_item_id UUID NOT NULL REFERENCES public.items(id),
    conversion_date DATE NOT NULL,
    from_quantity DECIMAL(15,2) NOT NULL,
    to_quantity DECIMAL(15,2) NOT NULL,
    location_id UUID NOT NULL REFERENCES public.stock_locations(id),
    status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'cancelled'
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, conversion_no)
);

-- Opening Stock (already in schema but adding detailed tracking)
CREATE TABLE IF NOT EXISTS public.opening_stock_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    entry_no TEXT NOT NULL,
    item_id UUID NOT NULL REFERENCES public.items(id),
    location_id UUID NOT NULL REFERENCES public.stock_locations(id),
    batch_no TEXT,
    manufacture_date DATE,
    expiry_date DATE,
    quantity DECIMAL(15,2) NOT NULL,
    unit_cost DECIMAL(15,2) NOT NULL,
    total_cost DECIMAL(15,2) NOT NULL,
    entry_date DATE NOT NULL,
    financial_year_id UUID REFERENCES public.financial_years(id),
    is_posted BOOLEAN DEFAULT FALSE,
    posted_by UUID REFERENCES auth.users(id),
    posted_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, entry_no)
);

-- ============================================
-- PROCUREMENT - MISSING FEATURES
-- ============================================

-- Purchase Comparison (Quotation Comparison)
CREATE TABLE IF NOT EXISTS public.purchase_comparisons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    comparison_no TEXT NOT NULL,
    requisition_id UUID REFERENCES public.purchase_requisitions(id),
    comparison_date DATE NOT NULL,
    selected_quotation_id UUID REFERENCES public.purchase_quotations(id),
    selected_supplier_id UUID REFERENCES public.suppliers(id),
    total_savings DECIMAL(15,2) DEFAULT 0,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, comparison_no)
);

-- Purchase Comparison Items
CREATE TABLE IF NOT EXISTS public.purchase_comparison_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comparison_id UUID NOT NULL REFERENCES public.purchase_comparisons(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.items(id),
    quotation_id UUID NOT NULL REFERENCES public.purchase_quotations(id),
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
    quantity DECIMAL(15,2) NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    is_selected BOOLEAN DEFAULT FALSE
);

-- Purchase Post (Posting purchase to accounts)
CREATE TABLE IF NOT EXISTS public.purchase_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    purchase_invoice_id UUID NOT NULL REFERENCES public.purchase_invoices(id),
    posted_date DATE NOT NULL,
    account_entries JSONB, -- Stores the accounting entries created
    posted_by UUID REFERENCES auth.users(id),
    posted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(purchase_invoice_id)
);

-- ============================================
-- SALES - MISSING FEATURES
-- ============================================

-- Proforma Invoice (already in schema but ensure it's complete)
-- Sales CRM
CREATE TABLE IF NOT EXISTS public.sales_crm (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id),
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    enquiry_date DATE NOT NULL,
    enquiry_type TEXT, -- 'new', 'follow_up', 'complaint', 'support'
    status TEXT DEFAULT 'open', -- 'open', 'contacted', 'quoted', 'converted', 'lost', 'closed'
    priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
    source TEXT, -- 'website', 'phone', 'email', 'referral', 'other'
    assigned_to UUID REFERENCES auth.users(id),
    expected_value DECIMAL(15,2),
    notes TEXT,
    next_followup_date DATE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sales CRM Activities
CREATE TABLE IF NOT EXISTS public.sales_crm_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    crm_id UUID NOT NULL REFERENCES public.sales_crm(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL, -- 'call', 'email', 'meeting', 'note', 'task'
    activity_date TIMESTAMPTZ NOT NULL,
    description TEXT,
    outcome TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Shipment Export Sales
CREATE TABLE IF NOT EXISTS public.shipment_export_sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    shipment_no TEXT NOT NULL,
    export_sale_id UUID NOT NULL REFERENCES public.export_sales(id),
    shipping_line TEXT,
    vessel_name TEXT,
    container_no TEXT,
    seal_no TEXT,
    port_of_loading TEXT,
    port_of_discharge TEXT,
    etd DATE, -- Estimated Time of Departure
    eta DATE, -- Estimated Time of Arrival
    shipping_date DATE,
    bl_no TEXT, -- Bill of Lading Number
    freight_amount DECIMAL(15,2) DEFAULT 0,
    insurance_amount DECIMAL(15,2) DEFAULT 0,
    status TEXT DEFAULT 'pending', -- 'pending', 'shipped', 'in_transit', 'delivered'
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, shipment_no)
);

-- Invoice Post (Posting sales invoice to accounts)
CREATE TABLE IF NOT EXISTS public.invoice_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    sales_invoice_id UUID REFERENCES public.sales_invoices(id),
    cash_sale_id UUID REFERENCES public.cash_sales(id),
    posted_date DATE NOT NULL,
    account_entries JSONB, -- Stores the accounting entries created
    posted_by UUID REFERENCES auth.users(id),
    posted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- CONTROL PANEL - MISSING FEATURES
-- ============================================

-- Role Assignment (Junction table for users and roles)
CREATE TABLE IF NOT EXISTS public.role_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID, -- This would reference a roles table if you create one
    role_name TEXT NOT NULL, -- Or use role_name directly
    assigned_by UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(company_id, user_id, role_name)
);

-- Roles Master (if not using the existing users.role field)
CREATE TABLE IF NOT EXISTS public.roles_master (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    role_code TEXT NOT NULL,
    role_name TEXT NOT NULL,
    description TEXT,
    permissions JSONB, -- Store permissions as JSON
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, role_code)
);

-- DiaDyn Settings (Dynamic settings - could be for dynamic forms/reports)
CREATE TABLE IF NOT EXISTS public.diadyn_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    setting_category TEXT NOT NULL,
    setting_key TEXT NOT NULL,
    setting_value JSONB,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, setting_category, setting_key)
);

-- ============================================
-- AUDIT TRAIL
-- ============================================

-- Enhanced Audit Trail
CREATE TABLE IF NOT EXISTS public.audit_trail (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    old_values JSONB,
    new_values JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Access Control Log
CREATE TABLE IF NOT EXISTS public.access_control_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    resource_type TEXT NOT NULL, -- 'page', 'function', 'report', 'data'
    resource_name TEXT NOT NULL,
    action TEXT NOT NULL, -- 'view', 'create', 'update', 'delete', 'export'
    allowed BOOLEAN NOT NULL,
    reason TEXT,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- REPORTS CONFIGURATION
-- ============================================

-- Report Definitions
CREATE TABLE IF NOT EXISTS public.report_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    report_code TEXT NOT NULL,
    report_name TEXT NOT NULL,
    report_category TEXT NOT NULL, -- 'sales', 'purchase', 'inventory', 'financial', 'hr', 'operation'
    report_type TEXT NOT NULL, -- 'summary', 'detailed', 'analytical'
    sql_query TEXT,
    parameters JSONB, -- Report parameters
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, report_code)
);

-- Report Schedules
CREATE TABLE IF NOT EXISTS public.report_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    report_id UUID NOT NULL REFERENCES public.report_definitions(id),
    schedule_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'yearly'
    schedule_time TIME,
    recipients TEXT[], -- Array of email addresses
    is_active BOOLEAN DEFAULT TRUE,
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_external_bill_matching_company ON public.external_bill_matching(company_id);
CREATE INDEX IF NOT EXISTS idx_pdc_discounting_pdc ON public.pdc_discounting(pdc_id);
CREATE INDEX IF NOT EXISTS idx_cash_flow_entries_category ON public.cash_flow_entries(category_id);
CREATE INDEX IF NOT EXISTS idx_daybook_date_account ON public.daybook(entry_date, account_id);
CREATE INDEX IF NOT EXISTS idx_bank_book_account_date ON public.bank_book(account_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_issued_cheques_status ON public.issued_cheques(status);
CREATE INDEX IF NOT EXISTS idx_receivables_customer ON public.receivables_summary(customer_id);
CREATE INDEX IF NOT EXISTS idx_payables_supplier ON public.payables_summary(supplier_id);
CREATE INDEX IF NOT EXISTS idx_goods_conversions_company ON public.goods_conversions(company_id);
CREATE INDEX IF NOT EXISTS idx_sales_crm_customer ON public.sales_crm(customer_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_table_record ON public.audit_trail(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_access_control_user ON public.access_control_log(user_id);

-- Enable RLS
ALTER TABLE public.external_bill_matching ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdc_discounting ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_status_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.non_stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_flow_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratio_analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daybook ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_book ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issued_cheques ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receivables_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payables_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goods_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opening_stock_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_crm ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_export_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_control_log ENABLE ROW LEVEL SECURITY;

