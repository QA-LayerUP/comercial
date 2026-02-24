-- ===================================================
-- Layer Comercial — PostgreSQL Schema Migration
-- Replicated from SQLite schema with Supabase Auth
-- ===================================================

-- Profiles (linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    nome TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL DEFAULT 'reader' CHECK (role IN ('admin', 'reader')),
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-create profile on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, role)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'nome', new.email), 'reader');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Clientes
CREATE TABLE IF NOT EXISTS public.clientes (
    id BIGSERIAL PRIMARY KEY,
    confidencialidade TEXT DEFAULT '',
    nome TEXT NOT NULL,
    cnpj_cpf TEXT DEFAULT '',
    contato_nome TEXT DEFAULT '',
    contato_email TEXT DEFAULT '',
    contato_telefone TEXT DEFAULT '',
    contrato_ativo BOOLEAN NOT NULL DEFAULT true,
    data_primeiro_contrato TEXT DEFAULT '',
    data_renovacao TEXT DEFAULT '',
    link_contrato TEXT DEFAULT '',
    link_proposta TEXT DEFAULT '',
    observacoes TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sales People
CREATE TABLE IF NOT EXISTS public.sales_people (
    id BIGSERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    cargo TEXT NOT NULL CHECK (cargo IN ('SDR', 'Estrategia', 'Vendedor', 'Gestao de projetos', 'Customer Success')),
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Regra Comissão
CREATE TABLE IF NOT EXISTS public.regra_comissao (
    id BIGSERIAL PRIMARY KEY,
    produto TEXT NOT NULL,
    categoria TEXT NOT NULL,
    perfil TEXT NOT NULL,
    tipo TEXT NOT NULL,
    especificacao TEXT NOT NULL,
    vigencia TEXT NOT NULL DEFAULT '',
    comissao_percentual NUMERIC(10,4) NOT NULL DEFAULT 0
);

-- Dropdown Options (cascading hierarchy)
CREATE TABLE IF NOT EXISTS public.dropdown_options (
    id BIGSERIAL PRIMARY KEY,
    produto TEXT NOT NULL,
    categoria TEXT,
    perfil TEXT,
    tipo TEXT,
    especificacao TEXT,
    vigencia TEXT
);

-- Vendas
CREATE TABLE IF NOT EXISTS public.vendas (
    id BIGSERIAL PRIMARY KEY,
    ano INTEGER NOT NULL,
    mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
    nome_cliente TEXT NOT NULL DEFAULT '',
    cliente_id BIGINT REFERENCES clientes(id) ON DELETE SET NULL,
    venda_codigo TEXT DEFAULT '',
    produto TEXT NOT NULL DEFAULT '',
    categoria TEXT NOT NULL DEFAULT '',
    perfil TEXT NOT NULL DEFAULT '',
    tipo TEXT NOT NULL DEFAULT '',
    especificacao TEXT NOT NULL DEFAULT '',
    vigencia TEXT DEFAULT '',
    valor NUMERIC(14,2) NOT NULL DEFAULT 0,
    repasse_desconto TEXT DEFAULT '',
    valor_repasse NUMERIC(14,2) NOT NULL DEFAULT 0,
    valor_calculo_comissao NUMERIC(14,2) NOT NULL DEFAULT 0,
    volume_horas NUMERIC(10,2) NOT NULL DEFAULT 0,
    valor_por_hora NUMERIC(10,2) NOT NULL DEFAULT 0,
    volume_sales_people INTEGER NOT NULL DEFAULT 1,
    estrategia1_id BIGINT REFERENCES sales_people(id) ON DELETE SET NULL,
    estrategia2_id BIGINT REFERENCES sales_people(id) ON DELETE SET NULL,
    vendedor1_id BIGINT REFERENCES sales_people(id) ON DELETE SET NULL,
    vendedor2_id BIGINT REFERENCES sales_people(id) ON DELETE SET NULL,
    gestao_projetos_id BIGINT REFERENCES sales_people(id) ON DELETE SET NULL,
    customer_success_id BIGINT REFERENCES sales_people(id) ON DELETE SET NULL,
    sdr_id BIGINT REFERENCES sales_people(id) ON DELETE SET NULL,
    comissao_percentual NUMERIC(10,4) NOT NULL DEFAULT 0,
    comissao_valor NUMERIC(14,2) NOT NULL DEFAULT 0,
    observacoes TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Metas
CREATE TABLE IF NOT EXISTS public.metas (
    id BIGSERIAL PRIMARY KEY,
    ano INTEGER NOT NULL,
    categoria TEXT NOT NULL,
    mes INTEGER CHECK (mes BETWEEN 1 AND 12),
    valor_meta NUMERIC(14,2) NOT NULL DEFAULT 0,
    UNIQUE (ano, categoria, mes)
);

-- ===================================================
-- Indexes
-- ===================================================
CREATE INDEX IF NOT EXISTS idx_vendas_ano ON vendas(ano);
CREATE INDEX IF NOT EXISTS idx_vendas_mes ON vendas(mes);
CREATE INDEX IF NOT EXISTS idx_vendas_categoria ON vendas(categoria);
CREATE INDEX IF NOT EXISTS idx_vendas_cliente_id ON vendas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_clientes_nome ON clientes(nome);
CREATE INDEX IF NOT EXISTS idx_sales_people_cargo ON sales_people(cargo);
CREATE INDEX IF NOT EXISTS idx_regra_produto ON regra_comissao(produto, categoria, perfil, tipo, especificacao, vigencia);
CREATE INDEX IF NOT EXISTS idx_dropdown_produto ON dropdown_options(produto);
CREATE INDEX IF NOT EXISTS idx_metas_ano ON metas(ano);

-- ===================================================
-- Row Level Security (RLS)
-- ===================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE regra_comissao ENABLE ROW LEVEL SECURITY;
ALTER TABLE dropdown_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE metas ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all, update own
CREATE POLICY "Profiles are viewable by authenticated" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "Admins can manage profiles" ON profiles FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Read access for all authenticated users on data tables
CREATE POLICY "Read all clientes" ON clientes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read all sales_people" ON sales_people FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read all regra_comissao" ON regra_comissao FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read all dropdown_options" ON dropdown_options FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read all vendas" ON vendas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read all metas" ON metas FOR SELECT TO authenticated USING (true);

-- Write access for admins only
CREATE POLICY "Admins manage clientes" ON clientes FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins manage sales_people" ON sales_people FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins manage regra_comissao" ON regra_comissao FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins manage dropdown_options" ON dropdown_options FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins manage vendas" ON vendas FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins manage metas" ON metas FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
