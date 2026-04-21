
-- Patients table
CREATE TABLE public.patients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  entry_date TIMESTAMPTZ NOT NULL,
  due_day INTEGER NOT NULL DEFAULT 10,
  monthly_fee NUMERIC NOT NULL DEFAULT 0,
  installments INTEGER NOT NULL DEFAULT 1,
  has_enrollment_fee BOOLEAN NOT NULL DEFAULT false,
  enrollment_fee NUMERIC NOT NULL DEFAULT 0,
  enrollment_due_date TIMESTAMPTZ,
  first_installment_date TIMESTAMPTZ,
  guardian_name TEXT NOT NULL DEFAULT '',
  guardian_contact TEXT NOT NULL DEFAULT '',
  ward TEXT NOT NULL DEFAULT 'feminina',
  referral_source TEXT NOT NULL DEFAULT '',
  interest_rate_monthly NUMERIC NOT NULL DEFAULT 2,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own patients" ON public.patients
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Transactions table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  amount NUMERIC NOT NULL DEFAULT 0,
  date DATE NOT NULL,
  status TEXT DEFAULT 'paid',
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own transactions" ON public.transactions
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Bills table
CREATE TABLE public.bills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  due_date TIMESTAMPTZ NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  subcategory TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  recurrence TEXT NOT NULL DEFAULT 'none',
  installment_number INTEGER,
  total_installments INTEGER,
  paid_at TIMESTAMPTZ,
  payment_date TIMESTAMPTZ,
  paid_amount NUMERIC,
  payment_method TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own bills" ON public.bills
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Invoices table
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  patient_name TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  due_date TIMESTAMPTZ NOT NULL,
  installment_number INTEGER NOT NULL DEFAULT 1,
  total_installments INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending',
  type TEXT NOT NULL DEFAULT 'monthly',
  paid_at TIMESTAMPTZ,
  interest_rate_monthly NUMERIC DEFAULT 2,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own invoices" ON public.invoices
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Invoice Payments table
CREATE TABLE public.invoice_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  payment_date TIMESTAMPTZ NOT NULL,
  method TEXT NOT NULL DEFAULT 'cash',
  is_late BOOLEAN DEFAULT false,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.invoice_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own invoice payments" ON public.invoice_payments
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Referral Sources table
CREATE TABLE public.referral_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.referral_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own referral sources" ON public.referral_sources
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Custom Categories table (stores both groups and subcategories)
CREATE TABLE public.custom_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- 'group' or 'subcategory'
  group_key TEXT, -- null for groups, references group key for subcategories
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own custom categories" ON public.custom_categories
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
