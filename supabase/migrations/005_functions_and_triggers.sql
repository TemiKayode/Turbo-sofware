-- Functions and Triggers for ERP System
-- Run after all table migrations

-- ============================================
-- AVERAGE COST CALCULATION FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION calculate_average_cost(
    p_item_id UUID,
    p_company_id UUID
) RETURNS DECIMAL(15,2) AS $$
DECLARE
    v_total_cost DECIMAL(15,2) := 0;
    v_total_quantity DECIMAL(15,2) := 0;
    v_avg_cost DECIMAL(15,2) := 0;
BEGIN
    -- Calculate weighted average cost from stock register
    SELECT 
        COALESCE(SUM(quantity * unit_cost), 0),
        COALESCE(SUM(quantity), 0)
    INTO v_total_cost, v_total_quantity
    FROM public.stock_register
    WHERE item_id = p_item_id 
    AND company_id = p_company_id
    AND transaction_type IN ('opening', 'purchase', 'transfer', 'adjustment')
    AND quantity > 0;

    IF v_total_quantity > 0 THEN
        v_avg_cost := v_total_cost / v_total_quantity;
    END IF;

    -- Update item average cost
    UPDATE public.items
    SET average_cost = v_avg_cost,
        updated_at = NOW()
    WHERE id = p_item_id;

    RETURN v_avg_cost;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STOCK UPDATE TRIGGER (for average cost)
-- ============================================

CREATE OR REPLACE FUNCTION update_item_average_cost()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalculate average cost when stock changes
    PERFORM calculate_average_cost(NEW.item_id, NEW.company_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_avg_cost_after_stock_change
AFTER INSERT OR UPDATE ON public.stock_register
FOR EACH ROW
WHEN (NEW.transaction_type IN ('purchase', 'transfer', 'adjustment'))
EXECUTE FUNCTION update_item_average_cost();

-- ============================================
-- NEGATIVE STOCK CHECK FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION check_negative_stock(
    p_item_id UUID,
    p_location_id UUID,
    p_quantity DECIMAL(15,2),
    p_company_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_current_stock DECIMAL(15,2) := 0;
    v_allow_negative BOOLEAN := FALSE;
BEGIN
    -- Get current stock
    SELECT COALESCE(SUM(quantity), 0)
    INTO v_current_stock
    FROM public.stock_register
    WHERE item_id = p_item_id
    AND location_id = p_location_id
    AND company_id = p_company_id;

    -- Check if negative stock is allowed (from settings)
    SELECT COALESCE(
        (SELECT setting_value::boolean 
         FROM public.master_settings 
         WHERE company_id = p_company_id 
         AND setting_key = 'allow_negative_stock'), 
        FALSE
    ) INTO v_allow_negative;

    -- Return true if stock would go negative and not allowed
    IF (v_current_stock + p_quantity) < 0 AND NOT v_allow_negative THEN
        RETURN FALSE;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FINANCIAL YEAR CLOSING FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION close_financial_year(
    p_company_id UUID,
    p_financial_year_id UUID,
    p_closed_by UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_year_record RECORD;
BEGIN
    -- Get financial year details
    SELECT * INTO v_year_record
    FROM public.financial_years
    WHERE id = p_financial_year_id
    AND company_id = p_company_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Financial year not found';
    END IF;

    IF v_year_record.is_closed THEN
        RAISE EXCEPTION 'Financial year is already closed';
    END IF;

    -- Close the financial year
    UPDATE public.financial_years
    SET is_closed = TRUE,
        closed_at = NOW(),
        closed_by = p_closed_by
    WHERE id = p_financial_year_id;

    -- Carry forward balances to next year (if exists)
    -- This would need to be customized based on business rules

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- RECEIVABLES CALCULATION FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION calculate_receivables(
    p_company_id UUID,
    p_as_on_date DATE DEFAULT CURRENT_DATE
) RETURNS VOID AS $$
BEGIN
    -- Delete existing summaries for the date
    DELETE FROM public.receivables_summary
    WHERE company_id = p_company_id
    AND as_on_date = p_as_on_date;

    -- Calculate and insert receivables
    INSERT INTO public.receivables_summary (
        company_id,
        customer_id,
        as_on_date,
        total_invoiced,
        total_received,
        total_advance,
        balance_amount,
        overdue_amount
    )
    SELECT 
        p_company_id,
        c.id,
        p_as_on_date,
        COALESCE(SUM(CASE WHEN si.invoice_date <= p_as_on_date THEN si.total_amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN r.receipt_date <= p_as_on_date THEN r.amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN ar.receipt_date <= p_as_on_date THEN ar.amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN si.invoice_date <= p_as_on_date THEN si.balance_amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN si.due_date < p_as_on_date AND si.balance_amount > 0 
                    THEN si.balance_amount ELSE 0 END), 0)
    FROM public.customers c
    LEFT JOIN public.sales_invoices si ON si.customer_id = c.id AND si.company_id = p_company_id
    LEFT JOIN public.receipts r ON r.receipt_id IN (
        SELECT receipt_id FROM public.receipt_allocations 
        WHERE reference_type = 'sales_invoice' AND reference_id = si.id
    )
    LEFT JOIN public.advance_receipts ar ON ar.customer_id = c.id AND ar.company_id = p_company_id
    WHERE c.company_id = p_company_id
    GROUP BY c.id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PAYABLES CALCULATION FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION calculate_payables(
    p_company_id UUID,
    p_as_on_date DATE DEFAULT CURRENT_DATE
) RETURNS VOID AS $$
BEGIN
    -- Delete existing summaries for the date
    DELETE FROM public.payables_summary
    WHERE company_id = p_company_id
    AND as_on_date = p_as_on_date;

    -- Calculate and insert payables
    INSERT INTO public.payables_summary (
        company_id,
        supplier_id,
        as_on_date,
        total_invoiced,
        total_paid,
        total_advance,
        balance_amount,
        overdue_amount
    )
    SELECT 
        p_company_id,
        s.id,
        p_as_on_date,
        COALESCE(SUM(CASE WHEN pi.invoice_date <= p_as_on_date THEN pi.total_amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN bp.payment_date <= p_as_on_date THEN bp.amount ELSE 0 END), 0),
        0, -- Advance payments to suppliers (if you have this table)
        COALESCE(SUM(CASE WHEN pi.invoice_date <= p_as_on_date THEN pi.balance_amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN pi.due_date < p_as_on_date AND pi.balance_amount > 0 
                    THEN pi.balance_amount ELSE 0 END), 0)
    FROM public.suppliers s
    LEFT JOIN public.purchase_invoices pi ON pi.supplier_id = s.id AND pi.company_id = p_company_id
    LEFT JOIN public.bank_payments bp ON bp.payment_id IN (
        SELECT payment_id FROM public.bank_payment_allocations 
        WHERE reference_type = 'purchase_invoice' AND reference_id = pi.id
    )
    WHERE s.company_id = p_company_id
    GROUP BY s.id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- DAYBOOK UPDATE FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION update_daybook(
    p_company_id UUID,
    p_entry_date DATE,
    p_account_id UUID
) RETURNS VOID AS $$
DECLARE
    v_debit DECIMAL(15,2) := 0;
    v_credit DECIMAL(15,2) := 0;
    v_balance DECIMAL(15,2) := 0;
    v_count INTEGER := 0;
BEGIN
    -- Calculate totals for the day
    SELECT 
        COALESCE(SUM(debit_amount), 0),
        COALESCE(SUM(credit_amount), 0),
        COUNT(*)
    INTO v_debit, v_credit, v_count
    FROM public.voucher_entries ve
    JOIN public.accounting_vouchers av ON av.id = ve.voucher_id
    WHERE av.company_id = p_company_id
    AND av.voucher_date = p_entry_date
    AND ve.account_id = p_account_id
    AND av.status = 'posted';

    -- Calculate balance (simplified - should consider opening balance)
    v_balance := v_debit - v_credit;

    -- Insert or update daybook
    INSERT INTO public.daybook (
        company_id,
        entry_date,
        account_id,
        debit_amount,
        credit_amount,
        balance,
        transaction_count
    ) VALUES (
        p_company_id,
        p_entry_date,
        p_account_id,
        v_debit,
        v_credit,
        v_balance,
        v_count
    )
    ON CONFLICT (company_id, entry_date, account_id)
    DO UPDATE SET
        debit_amount = EXCLUDED.debit_amount,
        credit_amount = EXCLUDED.credit_amount,
        balance = EXCLUDED.balance,
        transaction_count = EXCLUDED.transaction_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- BANK BOOK UPDATE FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION update_bank_book(
    p_company_id UUID,
    p_account_id UUID,
    p_entry_date DATE
) RETURNS VOID AS $$
DECLARE
    v_opening DECIMAL(15,2) := 0;
    v_debit DECIMAL(15,2) := 0;
    v_credit DECIMAL(15,2) := 0;
    v_closing DECIMAL(15,2) := 0;
    v_count INTEGER := 0;
BEGIN
    -- Get opening balance (previous day's closing)
    SELECT COALESCE(closing_balance, 0)
    INTO v_opening
    FROM public.bank_book
    WHERE company_id = p_company_id
    AND account_id = p_account_id
    AND entry_date < p_entry_date
    ORDER BY entry_date DESC
    LIMIT 1;

    -- Calculate day's transactions
    SELECT 
        COALESCE(SUM(CASE WHEN bp.payment_date = p_entry_date THEN bp.amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN r.receipt_date = p_entry_date THEN r.amount ELSE 0 END), 0),
        COUNT(*)
    INTO v_debit, v_credit, v_count
    FROM public.bank_payments bp
    FULL OUTER JOIN public.receipts r ON r.account_id = p_account_id
    WHERE (bp.account_id = p_account_id OR r.account_id = p_account_id)
    AND (bp.payment_date = p_entry_date OR r.receipt_date = p_entry_date)
    AND (bp.company_id = p_company_id OR r.company_id = p_company_id);

    v_closing := v_opening - v_debit + v_credit;

    -- Insert or update bank book
    INSERT INTO public.bank_book (
        company_id,
        account_id,
        entry_date,
        opening_balance,
        debit_amount,
        credit_amount,
        closing_balance,
        transaction_count
    ) VALUES (
        p_company_id,
        p_account_id,
        p_entry_date,
        v_opening,
        v_debit,
        v_credit,
        v_closing,
        v_count
    )
    ON CONFLICT (company_id, account_id, entry_date)
    DO UPDATE SET
        opening_balance = EXCLUDED.opening_balance,
        debit_amount = EXCLUDED.debit_amount,
        credit_amount = EXCLUDED.credit_amount,
        closing_balance = EXCLUDED.closing_balance,
        transaction_count = EXCLUDED.transaction_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- AUDIT TRAIL TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION create_audit_trail()
RETURNS TRIGGER AS $$
DECLARE
    v_company_id UUID;
BEGIN
    -- Get company_id from the record (assuming most tables have it)
    IF TG_TABLE_NAME = 'items' THEN
        v_company_id := NEW.company_id;
    ELSIF TG_TABLE_NAME = 'purchase_orders' THEN
        v_company_id := NEW.company_id;
    ELSIF TG_TABLE_NAME = 'sales_orders' THEN
        v_company_id := NEW.company_id;
    -- Add more table checks as needed
    END IF;

    IF TG_OP = 'DELETE' THEN
        INSERT INTO public.audit_trail (
            company_id,
            user_id,
            table_name,
            record_id,
            action,
            old_values,
            new_values
        ) VALUES (
            v_company_id,
            auth.uid(),
            TG_TABLE_NAME,
            OLD.id,
            'DELETE',
            row_to_json(OLD),
            NULL
        );
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.audit_trail (
            company_id,
            user_id,
            table_name,
            record_id,
            action,
            old_values,
            new_values
        ) VALUES (
            v_company_id,
            auth.uid(),
            TG_TABLE_NAME,
            NEW.id,
            'UPDATE',
            row_to_json(OLD),
            row_to_json(NEW)
        );
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO public.audit_trail (
            company_id,
            user_id,
            table_name,
            record_id,
            action,
            old_values,
            new_values
        ) VALUES (
            v_company_id,
            auth.uid(),
            TG_TABLE_NAME,
            NEW.id,
            'INSERT',
            NULL,
            row_to_json(NEW)
        );
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create audit trail triggers for key tables
-- (Add more as needed)
CREATE TRIGGER audit_items
AFTER INSERT OR UPDATE OR DELETE ON public.items
FOR EACH ROW EXECUTE FUNCTION create_audit_trail();

CREATE TRIGGER audit_purchase_orders
AFTER INSERT OR UPDATE OR DELETE ON public.purchase_orders
FOR EACH ROW EXECUTE FUNCTION create_audit_trail();

CREATE TRIGGER audit_sales_orders
AFTER INSERT OR UPDATE OR DELETE ON public.sales_orders
FOR EACH ROW EXECUTE FUNCTION create_audit_trail();

CREATE TRIGGER audit_sales_invoices
AFTER INSERT OR UPDATE OR DELETE ON public.sales_invoices
FOR EACH ROW EXECUTE FUNCTION create_audit_trail();

CREATE TRIGGER audit_accounting_vouchers
AFTER INSERT OR UPDATE OR DELETE ON public.accounting_vouchers
FOR EACH ROW EXECUTE FUNCTION create_audit_trail();

-- ============================================
-- PDC REMINDER FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION get_pdc_reminders(
    p_company_id UUID,
    p_days_ahead INTEGER DEFAULT 7
) RETURNS TABLE (
    pdc_id UUID,
    cheque_no TEXT,
    cheque_date DATE,
    due_date DATE,
    amount DECIMAL(15,2),
    drawer_name TEXT,
    days_until_due INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pdc.id,
        pdc.cheque_no,
        pdc.cheque_date,
        pdc.due_date,
        pdc.amount,
        pdc.drawer_name,
        pdc.due_date - CURRENT_DATE as days_until_due
    FROM public.pdc_cheques pdc
    WHERE pdc.company_id = p_company_id
    AND pdc.status = 'pending'
    AND pdc.due_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + (p_days_ahead || ' days')::INTERVAL)
    ORDER BY pdc.due_date;
END;
$$ LANGUAGE plpgsql;

