-- Additional RLS Policies for ERP Tables
-- Run after 002_erp_schema.sql
-- Note: Some basic policies may already exist in 002_erp_schema.sql
-- This file adds additional policies and ensures all tables have proper RLS

-- ============================================
-- INVENTORY MODULE RLS POLICIES
-- ============================================

-- Items (drop existing if present, then create)
DROP POLICY IF EXISTS "Users can view items in their company" ON public.items;
DROP POLICY IF EXISTS "Users can create items in their company" ON public.items;
DROP POLICY IF EXISTS "Users can update items in their company" ON public.items;
DROP POLICY IF EXISTS "Users can delete items in their company" ON public.items;

CREATE POLICY "Users can view items in their company"
    ON public.items FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM public.users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can create items in their company"
    ON public.items FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT company_id FROM public.users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update items in their company"
    ON public.items FOR UPDATE
    USING (
        company_id IN (
            SELECT company_id FROM public.users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can delete items in their company"
    ON public.items FOR DELETE
    USING (
        company_id IN (
            SELECT company_id FROM public.users WHERE id = auth.uid()
        )
    );

-- Stock Register
DROP POLICY IF EXISTS "Users can view stock register in their company" ON public.stock_register;
DROP POLICY IF EXISTS "Users can create stock register entries in their company" ON public.stock_register;

CREATE POLICY "Users can view stock register in their company"
    ON public.stock_register FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM public.users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can create stock register entries in their company"
    ON public.stock_register FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT company_id FROM public.users WHERE id = auth.uid()
        )
    );

-- Stock Transfers
DROP POLICY IF EXISTS "Users can view stock transfers in their company" ON public.stock_transfers;
DROP POLICY IF EXISTS "Users can create stock transfers in their company" ON public.stock_transfers;

CREATE POLICY "Users can view stock transfers in their company"
    ON public.stock_transfers FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM public.users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can create stock transfers in their company"
    ON public.stock_transfers FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT company_id FROM public.users WHERE id = auth.uid()
        )
    );

-- Stock Adjustments
DROP POLICY IF EXISTS "Users can view stock adjustments in their company" ON public.stock_adjustments;
DROP POLICY IF EXISTS "Users can create stock adjustments in their company" ON public.stock_adjustments;

CREATE POLICY "Users can view stock adjustments in their company"
    ON public.stock_adjustments FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM public.users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can create stock adjustments in their company"
    ON public.stock_adjustments FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT company_id FROM public.users WHERE id = auth.uid()
        )
    );

-- ============================================
-- PROCUREMENT MODULE RLS POLICIES
-- ============================================

-- Suppliers
DROP POLICY IF EXISTS "Users can view suppliers in their company" ON public.suppliers;
DROP POLICY IF EXISTS "Users can create suppliers in their company" ON public.suppliers;

CREATE POLICY "Users can view suppliers in their company"
    ON public.suppliers FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM public.users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can create suppliers in their company"
    ON public.suppliers FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT company_id FROM public.users WHERE id = auth.uid()
        )
    );

-- Purchase Orders
DROP POLICY IF EXISTS "Users can view purchase orders in their company" ON public.purchase_orders;
DROP POLICY IF EXISTS "Users can create purchase orders in their company" ON public.purchase_orders;

CREATE POLICY "Users can view purchase orders in their company"
    ON public.purchase_orders FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM public.users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can create purchase orders in their company"
    ON public.purchase_orders FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT company_id FROM public.users WHERE id = auth.uid()
        )
    );

-- Purchase Invoices
DROP POLICY IF EXISTS "Users can view purchase invoices in their company" ON public.purchase_invoices;
DROP POLICY IF EXISTS "Users can create purchase invoices in their company" ON public.purchase_invoices;

CREATE POLICY "Users can view purchase invoices in their company"
    ON public.purchase_invoices FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM public.users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can create purchase invoices in their company"
    ON public.purchase_invoices FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT company_id FROM public.users WHERE id = auth.uid()
        )
    );

-- ============================================
-- SALES MODULE RLS POLICIES
-- ============================================

-- Customers
DROP POLICY IF EXISTS "Users can view customers in their company" ON public.customers;
DROP POLICY IF EXISTS "Users can create customers in their company" ON public.customers;

CREATE POLICY "Users can view customers in their company"
    ON public.customers FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM public.users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can create customers in their company"
    ON public.customers FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT company_id FROM public.users WHERE id = auth.uid()
        )
    );

-- Sales Orders
DROP POLICY IF EXISTS "Users can view sales orders in their company" ON public.sales_orders;
DROP POLICY IF EXISTS "Users can create sales orders in their company" ON public.sales_orders;

CREATE POLICY "Users can view sales orders in their company"
    ON public.sales_orders FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM public.users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can create sales orders in their company"
    ON public.sales_orders FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT company_id FROM public.users WHERE id = auth.uid()
        )
    );

-- Sales Invoices
DROP POLICY IF EXISTS "Users can view sales invoices in their company" ON public.sales_invoices;
DROP POLICY IF EXISTS "Users can create sales invoices in their company" ON public.sales_invoices;

CREATE POLICY "Users can view sales invoices in their company"
    ON public.sales_invoices FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM public.users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can create sales invoices in their company"
    ON public.sales_invoices FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT company_id FROM public.users WHERE id = auth.uid()
        )
    );

-- Cash Sales
DROP POLICY IF EXISTS "Users can view cash sales in their company" ON public.cash_sales;
DROP POLICY IF EXISTS "Users can create cash sales in their company" ON public.cash_sales;

CREATE POLICY "Users can view cash sales in their company"
    ON public.cash_sales FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM public.users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can create cash sales in their company"
    ON public.cash_sales FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT company_id FROM public.users WHERE id = auth.uid()
        )
    );

-- ============================================
-- FINANCIALS MODULE RLS POLICIES
-- ============================================

-- Chart of Accounts
DROP POLICY IF EXISTS "Users can view chart of accounts in their company" ON public.chart_of_accounts;
DROP POLICY IF EXISTS "Users can create chart of accounts in their company" ON public.chart_of_accounts;

CREATE POLICY "Users can view chart of accounts in their company"
    ON public.chart_of_accounts FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM public.users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can create chart of accounts in their company"
    ON public.chart_of_accounts FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT company_id FROM public.users WHERE id = auth.uid()
        )
    );

-- Accounting Vouchers
DROP POLICY IF EXISTS "Users can view vouchers in their company" ON public.accounting_vouchers;
DROP POLICY IF EXISTS "Users can create vouchers in their company" ON public.accounting_vouchers;

CREATE POLICY "Users can view vouchers in their company"
    ON public.accounting_vouchers FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM public.users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can create vouchers in their company"
    ON public.accounting_vouchers FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT company_id FROM public.users WHERE id = auth.uid()
        )
    );

-- ============================================
-- HR & PAYROLL MODULE RLS POLICIES
-- ============================================

-- Employees
DROP POLICY IF EXISTS "Users can view employees in their company" ON public.employees;
DROP POLICY IF EXISTS "Users can create employees in their company" ON public.employees;

CREATE POLICY "Users can view employees in their company"
    ON public.employees FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM public.users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can create employees in their company"
    ON public.employees FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT company_id FROM public.users WHERE id = auth.uid()
        )
    );

-- Attendance
DROP POLICY IF EXISTS "Users can view attendance in their company" ON public.attendance;
DROP POLICY IF EXISTS "Users can create attendance in their company" ON public.attendance;

CREATE POLICY "Users can view attendance in their company"
    ON public.attendance FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM public.users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can create attendance in their company"
    ON public.attendance FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT company_id FROM public.users WHERE id = auth.uid()
        )
    );

-- Payroll
DROP POLICY IF EXISTS "Users can view payroll in their company" ON public.payroll;
DROP POLICY IF EXISTS "Users can create payroll in their company" ON public.payroll;

CREATE POLICY "Users can view payroll in their company"
    ON public.payroll FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM public.users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can create payroll in their company"
    ON public.payroll FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT company_id FROM public.users WHERE id = auth.uid()
        )
    );

-- ============================================
-- PROJECT MODULE RLS POLICIES
-- ============================================

-- Projects
DROP POLICY IF EXISTS "Users can view projects in their company" ON public.projects;
DROP POLICY IF EXISTS "Users can create projects in their company" ON public.projects;

CREATE POLICY "Users can view projects in their company"
    ON public.projects FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM public.users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can create projects in their company"
    ON public.projects FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT company_id FROM public.users WHERE id = auth.uid()
        )
    );

-- ============================================
-- CONTROL PANEL RLS POLICIES
-- ============================================

-- Branches
DROP POLICY IF EXISTS "Users can view branches in their company" ON public.branches;
DROP POLICY IF EXISTS "Users can create branches in their company" ON public.branches;

CREATE POLICY "Users can view branches in their company"
    ON public.branches FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM public.users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can create branches in their company"
    ON public.branches FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT company_id FROM public.users WHERE id = auth.uid()
        )
    );

-- Departments
DROP POLICY IF EXISTS "Users can view departments in their company" ON public.departments;
DROP POLICY IF EXISTS "Users can create departments in their company" ON public.departments;

CREATE POLICY "Users can view departments in their company"
    ON public.departments FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM public.users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can create departments in their company"
    ON public.departments FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT company_id FROM public.users WHERE id = auth.uid()
        )
    );

