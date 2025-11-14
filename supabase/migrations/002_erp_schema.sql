-- ERP System Database Schema
-- Extends the existing SaaS platform with full ERP functionality
-- IMPORTANT: Run 001_initial_schema.sql first to create the companies table

-- Ensure companies table exists (from initial schema)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'companies') THEN
        RAISE EXCEPTION 'Companies table does not exist. Please run 001_initial_schema.sql first.';
    END IF;
END $$;

-- ============================================
-- INVENTORY MODULE
-- ============================================

-- Item Master
CREATE TABLE IF NOT EXISTS public.items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    part_no TEXT NOT NULL,
    item_name TEXT NOT NULL,
    item_type_id UUID,
    category_id UUID,
    brand_id UUID,
    unit_id UUID,
    hs_code TEXT,
    barcode TEXT,
    description TEXT,
    average_cost DECIMAL(15,2) DEFAULT 0,
    selling_price DECIMAL(15,2) DEFAULT 0,
    min_stock_level DECIMAL(15,2) DEFAULT 0,
    max_stock_level DECIMAL(15,2) DEFAULT 0,
    track_batch BOOLEAN DEFAULT FALSE,
    track_expiry BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, part_no)
);

-- Item Types
CREATE TABLE IF NOT EXISTS public.item_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Item Categories
CREATE TABLE IF NOT EXISTS public.item_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    parent_id UUID REFERENCES public.item_categories(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Brands
CREATE TABLE IF NOT EXISTS public.brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Units
CREATE TABLE IF NOT EXISTS public.units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    abbreviation TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Stock Locations (Branches/Warehouses)
CREATE TABLE IF NOT EXISTS public.stock_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    branch_id UUID,
    name TEXT NOT NULL,
    address TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Stock Register
CREATE TABLE IF NOT EXISTS public.stock_register (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES public.stock_locations(id),
    batch_no TEXT,
    manufacture_date DATE,
    expiry_date DATE,
    quantity DECIMAL(15,2) NOT NULL,
    unit_cost DECIMAL(15,2) NOT NULL,
    transaction_type TEXT NOT NULL, -- 'opening', 'purchase', 'sale', 'transfer', 'adjustment', 'return'
    reference_id UUID, -- Links to purchase/sale/transfer document
    reference_type TEXT, -- 'purchase_order', 'sales_order', 'stock_transfer', etc.
    transaction_date DATE NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Stock Transfers
CREATE TABLE IF NOT EXISTS public.stock_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    transfer_no TEXT NOT NULL,
    from_location_id UUID NOT NULL REFERENCES public.stock_locations(id),
    to_location_id UUID NOT NULL REFERENCES public.stock_locations(id),
    transfer_date DATE NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'in_transit', 'completed', 'cancelled'
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, transfer_no)
);

-- Stock Transfer Items
CREATE TABLE IF NOT EXISTS public.stock_transfer_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transfer_id UUID NOT NULL REFERENCES public.stock_transfers(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.items(id),
    batch_no TEXT,
    quantity DECIMAL(15,2) NOT NULL,
    unit_cost DECIMAL(15,2) NOT NULL
);

-- Stock Adjustments
CREATE TABLE IF NOT EXISTS public.stock_adjustments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    adjustment_no TEXT NOT NULL,
    location_id UUID NOT NULL REFERENCES public.stock_locations(id),
    adjustment_date DATE NOT NULL,
    reason TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, adjustment_no)
);

-- Stock Adjustment Items
CREATE TABLE IF NOT EXISTS public.stock_adjustment_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    adjustment_id UUID NOT NULL REFERENCES public.stock_adjustments(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.items(id),
    batch_no TEXT,
    quantity DECIMAL(15,2) NOT NULL,
    unit_cost DECIMAL(15,2) NOT NULL,
    adjustment_type TEXT NOT NULL -- 'increase', 'decrease'
);

-- Stock Requests
CREATE TABLE IF NOT EXISTS public.stock_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    request_no TEXT NOT NULL,
    from_location_id UUID NOT NULL REFERENCES public.stock_locations(id),
    to_location_id UUID NOT NULL REFERENCES public.stock_locations(id),
    request_date DATE NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'fulfilled'
    notes TEXT,
    requested_by UUID REFERENCES auth.users(id),
    approved_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, request_no)
);

-- Stock Request Items
CREATE TABLE IF NOT EXISTS public.stock_request_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES public.stock_requests(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.items(id),
    quantity DECIMAL(15,2) NOT NULL,
    requested_quantity DECIMAL(15,2) NOT NULL
);

-- ============================================
-- PROCUREMENT MODULE
-- ============================================

-- Suppliers
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    supplier_code TEXT NOT NULL,
    supplier_name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT,
    postal_code TEXT,
    tax_id TEXT,
    payment_terms TEXT,
    credit_limit DECIMAL(15,2) DEFAULT 0,
    balance DECIMAL(15,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, supplier_code)
);

-- Purchase Requisitions
CREATE TABLE IF NOT EXISTS public.purchase_requisitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    requisition_no TEXT NOT NULL,
    requisition_date DATE NOT NULL,
    department_id UUID,
    requested_by UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'converted'
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, requisition_no)
);

-- Purchase Requisition Items
CREATE TABLE IF NOT EXISTS public.purchase_requisition_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requisition_id UUID NOT NULL REFERENCES public.purchase_requisitions(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.items(id),
    quantity DECIMAL(15,2) NOT NULL,
    unit_price DECIMAL(15,2),
    total_amount DECIMAL(15,2),
    notes TEXT
);

-- Purchase Quotations
CREATE TABLE IF NOT EXISTS public.purchase_quotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    quotation_no TEXT NOT NULL,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
    requisition_id UUID REFERENCES public.purchase_requisitions(id),
    quotation_date DATE NOT NULL,
    valid_until DATE,
    status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'converted'
    subtotal DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, quotation_no)
);

-- Purchase Quotation Items
CREATE TABLE IF NOT EXISTS public.purchase_quotation_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_id UUID NOT NULL REFERENCES public.purchase_quotations(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.items(id),
    quantity DECIMAL(15,2) NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    tax_percent DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL
);

-- Purchase Orders
CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    po_no TEXT NOT NULL,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
    quotation_id UUID REFERENCES public.purchase_quotations(id),
    requisition_id UUID REFERENCES public.purchase_requisitions(id),
    po_date DATE NOT NULL,
    expected_delivery_date DATE,
    location_id UUID REFERENCES public.stock_locations(id),
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'partially_received', 'completed', 'cancelled'
    subtotal DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    approved_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, po_no)
);

-- Purchase Order Items
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.items(id),
    quantity DECIMAL(15,2) NOT NULL,
    received_quantity DECIMAL(15,2) DEFAULT 0,
    unit_price DECIMAL(15,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    tax_percent DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL
);

-- Goods Receive Notes
CREATE TABLE IF NOT EXISTS public.goods_receive_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    grn_no TEXT NOT NULL,
    po_id UUID NOT NULL REFERENCES public.purchase_orders(id),
    location_id UUID NOT NULL REFERENCES public.stock_locations(id),
    receive_date DATE NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    notes TEXT,
    received_by UUID REFERENCES auth.users(id),
    approved_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, grn_no)
);

-- GRN Items
CREATE TABLE IF NOT EXISTS public.grn_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grn_id UUID NOT NULL REFERENCES public.goods_receive_notes(id) ON DELETE CASCADE,
    po_item_id UUID NOT NULL REFERENCES public.purchase_order_items(id),
    item_id UUID NOT NULL REFERENCES public.items(id),
    batch_no TEXT,
    manufacture_date DATE,
    expiry_date DATE,
    quantity DECIMAL(15,2) NOT NULL,
    unit_cost DECIMAL(15,2) NOT NULL,
    total_cost DECIMAL(15,2) NOT NULL
);

-- Purchase Invoices
CREATE TABLE IF NOT EXISTS public.purchase_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    invoice_no TEXT NOT NULL,
    supplier_invoice_no TEXT,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
    po_id UUID REFERENCES public.purchase_orders(id),
    grn_id UUID REFERENCES public.goods_receive_notes(id),
    invoice_date DATE NOT NULL,
    due_date DATE,
    location_id UUID REFERENCES public.stock_locations(id),
    status TEXT DEFAULT 'pending', -- 'pending', 'posted', 'paid', 'cancelled'
    subtotal DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    paid_amount DECIMAL(15,2) DEFAULT 0,
    balance_amount DECIMAL(15,2) DEFAULT 0,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    posted_by UUID REFERENCES auth.users(id),
    posted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, invoice_no)
);

-- Purchase Invoice Items
CREATE TABLE IF NOT EXISTS public.purchase_invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES public.purchase_invoices(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.items(id),
    quantity DECIMAL(15,2) NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    tax_percent DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL
);

-- Purchase Returns
CREATE TABLE IF NOT EXISTS public.purchase_returns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    return_no TEXT NOT NULL,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
    purchase_invoice_id UUID REFERENCES public.purchase_invoices(id),
    return_date DATE NOT NULL,
    location_id UUID REFERENCES public.stock_locations(id),
    status TEXT DEFAULT 'pending',
    reason TEXT,
    subtotal DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, return_no)
);

-- Purchase Return Items
CREATE TABLE IF NOT EXISTS public.purchase_return_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    return_id UUID NOT NULL REFERENCES public.purchase_returns(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.items(id),
    batch_no TEXT,
    quantity DECIMAL(15,2) NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL
);

-- ============================================
-- SALES MODULE
-- ============================================

-- Customers
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    customer_code TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT,
    postal_code TEXT,
    tax_id TEXT,
    credit_limit DECIMAL(15,2) DEFAULT 0,
    credit_days INTEGER DEFAULT 0,
    balance DECIMAL(15,2) DEFAULT 0,
    is_export_customer BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, customer_code)
);

-- Sales Enquiries
CREATE TABLE IF NOT EXISTS public.sales_enquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    enquiry_no TEXT NOT NULL,
    customer_id UUID NOT NULL REFERENCES public.customers(id),
    enquiry_date DATE NOT NULL,
    status TEXT DEFAULT 'open', -- 'open', 'quoted', 'converted', 'lost', 'cancelled'
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, enquiry_no)
);

-- Sales Enquiry Items
CREATE TABLE IF NOT EXISTS public.sales_enquiry_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    enquiry_id UUID NOT NULL REFERENCES public.sales_enquiries(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.items(id),
    quantity DECIMAL(15,2) NOT NULL,
    unit_price DECIMAL(15,2),
    notes TEXT
);

-- Sales Quotations
CREATE TABLE IF NOT EXISTS public.sales_quotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    quotation_no TEXT NOT NULL,
    customer_id UUID NOT NULL REFERENCES public.customers(id),
    enquiry_id UUID REFERENCES public.sales_enquiries(id),
    quotation_date DATE NOT NULL,
    valid_until DATE,
    status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'expired', 'converted'
    subtotal DECIMAL(15,2) DEFAULT 0,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, quotation_no)
);

-- Sales Quotation Items
CREATE TABLE IF NOT EXISTS public.sales_quotation_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_id UUID NOT NULL REFERENCES public.sales_quotations(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.items(id),
    quantity DECIMAL(15,2) NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    tax_percent DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL
);

-- Stock Reservations
CREATE TABLE IF NOT EXISTS public.stock_reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    reservation_no TEXT NOT NULL,
    quotation_id UUID REFERENCES public.sales_quotations(id),
    sales_order_id UUID,
    location_id UUID NOT NULL REFERENCES public.stock_locations(id),
    reservation_date DATE NOT NULL,
    expiry_date DATE,
    status TEXT DEFAULT 'reserved', -- 'reserved', 'confirmed', 'released', 'expired'
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, reservation_no)
);

-- Stock Reservation Items
CREATE TABLE IF NOT EXISTS public.stock_reservation_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservation_id UUID NOT NULL REFERENCES public.stock_reservations(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.items(id),
    batch_no TEXT,
    quantity DECIMAL(15,2) NOT NULL
);

-- Sales Orders
CREATE TABLE IF NOT EXISTS public.sales_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    order_no TEXT NOT NULL,
    customer_id UUID NOT NULL REFERENCES public.customers(id),
    quotation_id UUID REFERENCES public.sales_quotations(id),
    enquiry_id UUID REFERENCES public.sales_enquiries(id),
    order_date DATE NOT NULL,
    delivery_date DATE,
    location_id UUID NOT NULL REFERENCES public.stock_locations(id),
    salesman_id UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'partially_delivered', 'delivered', 'cancelled'
    subtotal DECIMAL(15,2) DEFAULT 0,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, order_no)
);

-- Sales Order Items
CREATE TABLE IF NOT EXISTS public.sales_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.sales_orders(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.items(id),
    quantity DECIMAL(15,2) NOT NULL,
    delivered_quantity DECIMAL(15,2) DEFAULT 0,
    unit_price DECIMAL(15,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    tax_percent DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL
);

-- Delivery Orders
CREATE TABLE IF NOT EXISTS public.delivery_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    do_no TEXT NOT NULL,
    sales_order_id UUID NOT NULL REFERENCES public.sales_orders(id),
    location_id UUID NOT NULL REFERENCES public.stock_locations(id),
    delivery_date DATE NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'delivered', 'cancelled'
    delivery_address TEXT,
    notes TEXT,
    delivered_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, do_no)
);

-- Delivery Order Items
CREATE TABLE IF NOT EXISTS public.delivery_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    do_id UUID NOT NULL REFERENCES public.delivery_orders(id) ON DELETE CASCADE,
    order_item_id UUID NOT NULL REFERENCES public.sales_order_items(id),
    item_id UUID NOT NULL REFERENCES public.items(id),
    batch_no TEXT,
    quantity DECIMAL(15,2) NOT NULL
);

-- Sales Invoices (Credit Sales)
CREATE TABLE IF NOT EXISTS public.sales_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    invoice_no TEXT NOT NULL,
    customer_id UUID NOT NULL REFERENCES public.customers(id),
    sales_order_id UUID REFERENCES public.sales_orders(id),
    do_id UUID REFERENCES public.delivery_orders(id),
    invoice_date DATE NOT NULL,
    due_date DATE,
    location_id UUID REFERENCES public.stock_locations(id),
    salesman_id UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'pending', -- 'pending', 'posted', 'paid', 'cancelled'
    subtotal DECIMAL(15,2) DEFAULT 0,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    paid_amount DECIMAL(15,2) DEFAULT 0,
    balance_amount DECIMAL(15,2) DEFAULT 0,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    posted_by UUID REFERENCES auth.users(id),
    posted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, invoice_no)
);

-- Sales Invoice Items
CREATE TABLE IF NOT EXISTS public.sales_invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES public.sales_invoices(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.items(id),
    quantity DECIMAL(15,2) NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    tax_percent DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,
    cost_amount DECIMAL(15,2) DEFAULT 0 -- For profit calculation
);

-- Cash Sales
CREATE TABLE IF NOT EXISTS public.cash_sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    sale_no TEXT NOT NULL,
    customer_id UUID REFERENCES public.customers(id),
    location_id UUID NOT NULL REFERENCES public.stock_locations(id),
    sale_date DATE NOT NULL,
    cashier_id UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'pending', -- 'pending', 'posted', 'cancelled'
    subtotal DECIMAL(15,2) DEFAULT 0,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    payment_mode TEXT, -- 'cash', 'card', 'mixed'
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    posted_by UUID REFERENCES auth.users(id),
    posted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, sale_no)
);

-- Cash Sale Items
CREATE TABLE IF NOT EXISTS public.cash_sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID NOT NULL REFERENCES public.cash_sales(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.items(id),
    batch_no TEXT,
    quantity DECIMAL(15,2) NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    tax_percent DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,
    cost_amount DECIMAL(15,2) DEFAULT 0
);

-- Cash Sales Returns
CREATE TABLE IF NOT EXISTS public.cash_sales_returns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    return_no TEXT NOT NULL,
    cash_sale_id UUID NOT NULL REFERENCES public.cash_sales(id),
    location_id UUID REFERENCES public.stock_locations(id),
    return_date DATE NOT NULL,
    status TEXT DEFAULT 'pending',
    reason TEXT,
    subtotal DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, return_no)
);

-- Cash Sales Return Items
CREATE TABLE IF NOT EXISTS public.cash_sales_return_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    return_id UUID NOT NULL REFERENCES public.cash_sales_returns(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.items(id),
    batch_no TEXT,
    quantity DECIMAL(15,2) NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL
);

-- Credit Sales Returns
CREATE TABLE IF NOT EXISTS public.credit_sales_returns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    return_no TEXT NOT NULL,
    sales_invoice_id UUID NOT NULL REFERENCES public.sales_invoices(id),
    location_id UUID REFERENCES public.stock_locations(id),
    return_date DATE NOT NULL,
    status TEXT DEFAULT 'pending',
    reason TEXT,
    subtotal DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, return_no)
);

-- Credit Sales Return Items
CREATE TABLE IF NOT EXISTS public.credit_sales_return_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    return_id UUID NOT NULL REFERENCES public.credit_sales_returns(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.items(id),
    batch_no TEXT,
    quantity DECIMAL(15,2) NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL
);

-- Export Sales
CREATE TABLE IF NOT EXISTS public.export_sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    export_no TEXT NOT NULL,
    customer_id UUID NOT NULL REFERENCES public.customers(id),
    sales_order_id UUID REFERENCES public.sales_orders(id),
    invoice_id UUID REFERENCES public.sales_invoices(id),
    export_date DATE NOT NULL,
    shipment_date DATE,
    port_of_loading TEXT,
    port_of_discharge TEXT,
    incoterms TEXT,
    currency TEXT DEFAULT 'USD',
    exchange_rate DECIMAL(10,4) DEFAULT 1,
    packing_list_no TEXT,
    commercial_invoice_no TEXT,
    status TEXT DEFAULT 'pending',
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, export_no)
);

-- Packing Lists
CREATE TABLE IF NOT EXISTS public.packing_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    packing_list_no TEXT NOT NULL,
    export_sale_id UUID NOT NULL REFERENCES public.export_sales(id),
    packing_date DATE NOT NULL,
    total_packages INTEGER,
    total_weight DECIMAL(15,2),
    total_volume DECIMAL(15,2),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, packing_list_no)
);

-- Packing List Items
CREATE TABLE IF NOT EXISTS public.packing_list_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    packing_list_id UUID NOT NULL REFERENCES public.packing_lists(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.items(id),
    package_no INTEGER,
    quantity DECIMAL(15,2) NOT NULL,
    weight DECIMAL(15,2),
    volume DECIMAL(15,2),
    description TEXT
);

-- Commercial Invoices
CREATE TABLE IF NOT EXISTS public.commercial_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    commercial_invoice_no TEXT NOT NULL,
    export_sale_id UUID NOT NULL REFERENCES public.export_sales(id),
    invoice_date DATE NOT NULL,
    currency TEXT DEFAULT 'USD',
    exchange_rate DECIMAL(10,4) DEFAULT 1,
    subtotal DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, commercial_invoice_no)
);

-- Commercial Invoice Items
CREATE TABLE IF NOT EXISTS public.commercial_invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    commercial_invoice_id UUID NOT NULL REFERENCES public.commercial_invoices(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.items(id),
    quantity DECIMAL(15,2) NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    hs_code TEXT
);

-- ============================================
-- FINANCIALS MODULE
-- ============================================

-- Chart of Accounts
CREATE TABLE IF NOT EXISTS public.chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    account_code TEXT NOT NULL,
    account_name TEXT NOT NULL,
    account_type TEXT NOT NULL, -- 'asset', 'liability', 'equity', 'income', 'expense'
    parent_id UUID REFERENCES public.chart_of_accounts(id),
    is_control_account BOOLEAN DEFAULT FALSE,
    control_account_id UUID REFERENCES public.chart_of_accounts(id),
    opening_balance DECIMAL(15,2) DEFAULT 0,
    current_balance DECIMAL(15,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, account_code)
);

-- Accounting Vouchers
CREATE TABLE IF NOT EXISTS public.accounting_vouchers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    voucher_no TEXT NOT NULL,
    voucher_type TEXT NOT NULL, -- 'journal', 'payment', 'receipt', 'contra'
    voucher_date DATE NOT NULL,
    financial_year_id UUID,
    status TEXT DEFAULT 'draft', -- 'draft', 'posted', 'cancelled'
    total_debit DECIMAL(15,2) DEFAULT 0,
    total_credit DECIMAL(15,2) DEFAULT 0,
    narration TEXT,
    created_by UUID REFERENCES auth.users(id),
    posted_by UUID REFERENCES auth.users(id),
    posted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, voucher_no, voucher_type)
);

-- Voucher Entries
CREATE TABLE IF NOT EXISTS public.voucher_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voucher_id UUID NOT NULL REFERENCES public.accounting_vouchers(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.chart_of_accounts(id),
    debit_amount DECIMAL(15,2) DEFAULT 0,
    credit_amount DECIMAL(15,2) DEFAULT 0,
    narration TEXT
);

-- Bank Payments
CREATE TABLE IF NOT EXISTS public.bank_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    payment_no TEXT NOT NULL,
    account_id UUID NOT NULL REFERENCES public.chart_of_accounts(id), -- Bank account
    payment_date DATE NOT NULL,
    payment_mode TEXT, -- 'cheque', 'transfer', 'online'
    cheque_no TEXT,
    cheque_date DATE,
    beneficiary_name TEXT,
    amount DECIMAL(15,2) NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'cleared', 'bounced', 'cancelled'
    narration TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, payment_no)
);

-- Bank Payment Allocations
CREATE TABLE IF NOT EXISTS public.bank_payment_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES public.bank_payments(id) ON DELETE CASCADE,
    reference_type TEXT, -- 'purchase_invoice', 'expense', etc.
    reference_id UUID,
    amount DECIMAL(15,2) NOT NULL
);

-- Cash Payments
CREATE TABLE IF NOT EXISTS public.cash_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    payment_no TEXT NOT NULL,
    account_id UUID NOT NULL REFERENCES public.chart_of_accounts(id), -- Cash account
    payment_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    narration TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, payment_no)
);

-- Cash Payment Allocations
CREATE TABLE IF NOT EXISTS public.cash_payment_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES public.cash_payments(id) ON DELETE CASCADE,
    reference_type TEXT,
    reference_id UUID,
    amount DECIMAL(15,2) NOT NULL
);

-- Receipts
CREATE TABLE IF NOT EXISTS public.receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    receipt_no TEXT NOT NULL,
    account_id UUID NOT NULL REFERENCES public.chart_of_accounts(id), -- Bank or Cash account
    receipt_date DATE NOT NULL,
    receipt_mode TEXT, -- 'cash', 'cheque', 'transfer', 'online'
    cheque_no TEXT,
    cheque_date DATE,
    payer_name TEXT,
    amount DECIMAL(15,2) NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'cleared', 'bounced', 'cancelled'
    narration TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, receipt_no)
);

-- Receipt Allocations
CREATE TABLE IF NOT EXISTS public.receipt_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receipt_id UUID NOT NULL REFERENCES public.receipts(id) ON DELETE CASCADE,
    reference_type TEXT, -- 'sales_invoice', 'advance', etc.
    reference_id UUID,
    amount DECIMAL(15,2) NOT NULL
);

-- Advance Receipts
CREATE TABLE IF NOT EXISTS public.advance_receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    receipt_no TEXT NOT NULL,
    customer_id UUID REFERENCES public.customers(id),
    account_id UUID NOT NULL REFERENCES public.chart_of_accounts(id),
    receipt_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    allocated_amount DECIMAL(15,2) DEFAULT 0,
    balance_amount DECIMAL(15,2) NOT NULL,
    narration TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, receipt_no)
);

-- Cash Deposits
CREATE TABLE IF NOT EXISTS public.cash_deposits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    deposit_no TEXT NOT NULL,
    from_account_id UUID NOT NULL REFERENCES public.chart_of_accounts(id), -- Cash account
    to_account_id UUID NOT NULL REFERENCES public.chart_of_accounts(id), -- Bank account
    deposit_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    narration TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, deposit_no)
);

-- Cheque Deposits
CREATE TABLE IF NOT EXISTS public.cheque_deposits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    deposit_no TEXT NOT NULL,
    account_id UUID NOT NULL REFERENCES public.chart_of_accounts(id), -- Bank account
    deposit_date DATE NOT NULL,
    cheque_no TEXT NOT NULL,
    cheque_date DATE NOT NULL,
    drawer_name TEXT,
    amount DECIMAL(15,2) NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'cleared', 'bounced'
    cleared_date DATE,
    narration TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, deposit_no)
);

-- Bank Reconciliation
CREATE TABLE IF NOT EXISTS public.bank_reconciliations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.chart_of_accounts(id),
    reconciliation_date DATE NOT NULL,
    opening_balance DECIMAL(15,2) NOT NULL,
    closing_balance DECIMAL(15,2) NOT NULL,
    bank_statement_balance DECIMAL(15,2) NOT NULL,
    difference DECIMAL(15,2) DEFAULT 0,
    status TEXT DEFAULT 'pending', -- 'pending', 'reconciled'
    reconciled_by UUID REFERENCES auth.users(id),
    reconciled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bank Reconciliation Items
CREATE TABLE IF NOT EXISTS public.bank_reconciliation_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reconciliation_id UUID NOT NULL REFERENCES public.bank_reconciliations(id) ON DELETE CASCADE,
    transaction_type TEXT, -- 'payment', 'receipt', 'deposit'
    transaction_id UUID,
    amount DECIMAL(15,2) NOT NULL,
    is_reconciled BOOLEAN DEFAULT FALSE
);

-- PDC (Post Dated Cheques)
CREATE TABLE IF NOT EXISTS public.pdc_cheques (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    cheque_no TEXT NOT NULL,
    account_id UUID NOT NULL REFERENCES public.chart_of_accounts(id),
    cheque_date DATE NOT NULL,
    due_date DATE NOT NULL,
    drawer_name TEXT,
    amount DECIMAL(15,2) NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'deposited', 'cleared', 'bounced', 'discounted'
    pdc_type TEXT, -- 'receivable', 'payable'
    reference_type TEXT,
    reference_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prepaid Expenses
CREATE TABLE IF NOT EXISTS public.prepaid_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    expense_no TEXT NOT NULL,
    account_id UUID NOT NULL REFERENCES public.chart_of_accounts(id),
    expense_date DATE NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    allocated_amount DECIMAL(15,2) DEFAULT 0,
    balance_amount DECIMAL(15,2) NOT NULL,
    period_start DATE,
    period_end DATE,
    narration TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, expense_no)
);

-- Financial Budgets
CREATE TABLE IF NOT EXISTS public.financial_budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    budget_name TEXT NOT NULL,
    financial_year_id UUID,
    account_id UUID NOT NULL REFERENCES public.chart_of_accounts(id),
    budget_amount DECIMAL(15,2) NOT NULL,
    period_type TEXT, -- 'monthly', 'quarterly', 'yearly'
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Financial Year
CREATE TABLE IF NOT EXISTS public.financial_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    year_name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_closed BOOLEAN DEFAULT FALSE,
    closed_at TIMESTAMPTZ,
    closed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- HR & PAYROLL MODULE
-- ============================================

-- Departments
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    department_code TEXT NOT NULL,
    department_name TEXT NOT NULL,
    parent_id UUID REFERENCES public.departments(id),
    manager_id UUID REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, department_code)
);

-- Employees
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    employee_code TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    department_id UUID REFERENCES public.departments(id),
    designation TEXT,
    joining_date DATE,
    employment_type TEXT, -- 'permanent', 'contract', 'temporary'
    salary DECIMAL(15,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, employee_code)
);

-- Shifts
CREATE TABLE IF NOT EXISTS public.shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    shift_name TEXT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_duration INTEGER DEFAULT 0, -- in minutes
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Attendance
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id),
    attendance_date DATE NOT NULL,
    shift_id UUID REFERENCES public.shifts(id),
    check_in_time TIMESTAMPTZ,
    check_out_time TIMESTAMPTZ,
    break_duration INTEGER DEFAULT 0,
    total_hours DECIMAL(5,2),
    status TEXT DEFAULT 'present', -- 'present', 'absent', 'half_day', 'leave'
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(employee_id, attendance_date)
);

-- Leave Categories
CREATE TABLE IF NOT EXISTS public.leave_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    category_name TEXT NOT NULL,
    max_days INTEGER,
    carry_forward BOOLEAN DEFAULT FALSE,
    is_paid BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Leave Policies
CREATE TABLE IF NOT EXISTS public.leave_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    policy_name TEXT NOT NULL,
    leave_category_id UUID NOT NULL REFERENCES public.leave_categories(id),
    eligibility_months INTEGER DEFAULT 0,
    max_days INTEGER,
    accrual_rate DECIMAL(5,2), -- days per month
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Leave Requests
CREATE TABLE IF NOT EXISTS public.leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id),
    leave_category_id UUID NOT NULL REFERENCES public.leave_categories(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days DECIMAL(5,2) NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'cancelled'
    requested_by UUID REFERENCES auth.users(id),
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Employee Leave Balance
CREATE TABLE IF NOT EXISTS public.employee_leave_balance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id),
    leave_category_id UUID NOT NULL REFERENCES public.leave_categories(id),
    financial_year_id UUID,
    allocated_days DECIMAL(5,2) DEFAULT 0,
    used_days DECIMAL(5,2) DEFAULT 0,
    balance_days DECIMAL(5,2) DEFAULT 0,
    carry_forward_days DECIMAL(5,2) DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(employee_id, leave_category_id, financial_year_id)
);

-- Advance Loans
CREATE TABLE IF NOT EXISTS public.advance_loans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    loan_no TEXT NOT NULL,
    employee_id UUID NOT NULL REFERENCES public.employees(id),
    loan_date DATE NOT NULL,
    loan_amount DECIMAL(15,2) NOT NULL,
    interest_rate DECIMAL(5,2) DEFAULT 0,
    installment_amount DECIMAL(15,2),
    total_installments INTEGER,
    paid_installments INTEGER DEFAULT 0,
    paid_amount DECIMAL(15,2) DEFAULT 0,
    balance_amount DECIMAL(15,2) NOT NULL,
    status TEXT DEFAULT 'active', -- 'active', 'completed', 'cancelled'
    narration TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, loan_no)
);

-- Deductions
CREATE TABLE IF NOT EXISTS public.deductions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    deduction_code TEXT NOT NULL,
    deduction_name TEXT NOT NULL,
    deduction_type TEXT, -- 'fixed', 'percentage'
    amount DECIMAL(15,2),
    percentage DECIMAL(5,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, deduction_code)
);

-- Payroll
CREATE TABLE IF NOT EXISTS public.payroll (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    payroll_no TEXT NOT NULL,
    employee_id UUID NOT NULL REFERENCES public.employees(id),
    payroll_month DATE NOT NULL,
    financial_year_id UUID,
    basic_salary DECIMAL(15,2) DEFAULT 0,
    allowances DECIMAL(15,2) DEFAULT 0,
    overtime DECIMAL(15,2) DEFAULT 0,
    gross_salary DECIMAL(15,2) DEFAULT 0,
    deductions DECIMAL(15,2) DEFAULT 0,
    net_salary DECIMAL(15,2) DEFAULT 0,
    status TEXT DEFAULT 'draft', -- 'draft', 'approved', 'paid'
    paid_date DATE,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, payroll_no)
);

-- Payroll Details (Allowances and Deductions)
CREATE TABLE IF NOT EXISTS public.payroll_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payroll_id UUID NOT NULL REFERENCES public.payroll(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL, -- 'allowance', 'deduction'
    item_name TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    is_taxable BOOLEAN DEFAULT FALSE
);

-- Seasons (for seasonal employees)
CREATE TABLE IF NOT EXISTS public.seasons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    season_name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Other Requests (HR requests like training, etc.)
CREATE TABLE IF NOT EXISTS public.other_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    request_no TEXT NOT NULL,
    employee_id UUID NOT NULL REFERENCES public.employees(id),
    request_type TEXT NOT NULL, -- 'training', 'transfer', 'promotion', etc.
    request_date DATE NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    requested_by UUID REFERENCES auth.users(id),
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, request_no)
);

-- ============================================
-- PROJECT MODULE
-- ============================================

-- Projects
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    project_code TEXT NOT NULL,
    project_name TEXT NOT NULL,
    customer_id UUID REFERENCES public.customers(id),
    start_date DATE,
    end_date DATE,
    budget DECIMAL(15,2) DEFAULT 0,
    actual_cost DECIMAL(15,2) DEFAULT 0,
    status TEXT DEFAULT 'planning', -- 'planning', 'active', 'on_hold', 'completed', 'cancelled'
    project_manager_id UUID REFERENCES auth.users(id),
    description TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, project_code)
);

-- Project Tasks
CREATE TABLE IF NOT EXISTS public.project_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    task_name TEXT NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    assigned_to UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'
    priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
    progress_percent INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Project Expenses
CREATE TABLE IF NOT EXISTS public.project_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    expense_date DATE NOT NULL,
    account_id UUID REFERENCES public.chart_of_accounts(id),
    amount DECIMAL(15,2) NOT NULL,
    description TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- CONTROL PANEL / SETTINGS
-- ============================================

-- Branches
CREATE TABLE IF NOT EXISTS public.branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    branch_code TEXT NOT NULL,
    branch_name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT,
    postal_code TEXT,
    phone TEXT,
    email TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, branch_code)
);

-- Currencies
CREATE TABLE IF NOT EXISTS public.currencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    currency_code TEXT NOT NULL,
    currency_name TEXT NOT NULL,
    symbol TEXT,
    is_base_currency BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, currency_code)
);

-- Exchange Rates
CREATE TABLE IF NOT EXISTS public.exchange_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    from_currency_id UUID NOT NULL REFERENCES public.currencies(id),
    to_currency_id UUID NOT NULL REFERENCES public.currencies(id),
    rate_date DATE NOT NULL,
    exchange_rate DECIMAL(10,4) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tax Master
CREATE TABLE IF NOT EXISTS public.tax_master (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    tax_code TEXT NOT NULL,
    tax_name TEXT NOT NULL,
    tax_type TEXT, -- 'vat', 'gst', 'sales_tax', 'service_tax'
    tax_percent DECIMAL(5,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, tax_code)
);

-- Salary Tax (Tax slabs for payroll)
CREATE TABLE IF NOT EXISTS public.salary_tax (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    tax_year INTEGER NOT NULL,
    min_income DECIMAL(15,2) NOT NULL,
    max_income DECIMAL(15,2),
    tax_percent DECIMAL(5,2) NOT NULL,
    fixed_amount DECIMAL(15,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Master Settings
CREATE TABLE IF NOT EXISTS public.master_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    setting_key TEXT NOT NULL,
    setting_value TEXT,
    setting_type TEXT, -- 'string', 'number', 'boolean', 'json'
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, setting_key)
);

-- Discount Levels
CREATE TABLE IF NOT EXISTS public.discount_levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    level_name TEXT NOT NULL,
    discount_percent DECIMAL(5,2) NOT NULL,
    min_amount DECIMAL(15,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_items_company_partno ON public.items(company_id, part_no);
CREATE INDEX IF NOT EXISTS idx_stock_register_item ON public.stock_register(item_id, location_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON public.purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_customer ON public.sales_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_customer ON public.sales_invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_company ON public.chart_of_accounts(company_id);
CREATE INDEX IF NOT EXISTS idx_voucher_entries_account ON public.voucher_entries(account_id);
CREATE INDEX IF NOT EXISTS idx_employees_company ON public.employees(company_id);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON public.attendance(employee_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_payroll_employee_month ON public.payroll(employee_id, payroll_month);

-- Enable RLS on all new tables
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_register ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies are created in 003_erp_rls_policies.sql
-- This ensures all policies are created in one place and avoids duplicates


