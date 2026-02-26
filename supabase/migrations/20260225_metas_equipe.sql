-- =============================================================================
-- Metas Equipe: metas individuais por pessoa, categoria e mês
-- Rode este SQL no Supabase Dashboard → SQL Editor
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.metas_equipe (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ano         integer          NOT NULL,
    mes         integer          NOT NULL CHECK (mes BETWEEN 1 AND 12),
    categoria   text             NOT NULL,
    sales_person_id integer      NOT NULL,
    valor_meta  numeric(15, 2)   NOT NULL DEFAULT 0,
    created_at  timestamptz      NOT NULL DEFAULT now(),

    CONSTRAINT fk_metas_equipe_sales_person
        FOREIGN KEY (sales_person_id) REFERENCES public.sales_people (id) ON DELETE CASCADE,

    CONSTRAINT uq_metas_equipe
        UNIQUE (ano, mes, categoria, sales_person_id)
);

CREATE INDEX IF NOT EXISTS idx_metas_equipe_ano
    ON public.metas_equipe (ano);

CREATE INDEX IF NOT EXISTS idx_metas_equipe_person
    ON public.metas_equipe (sales_person_id);

CREATE INDEX IF NOT EXISTS idx_metas_equipe_categoria
    ON public.metas_equipe (categoria);

-- RLS
ALTER TABLE public.metas_equipe ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read metas_equipe"
    ON public.metas_equipe FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage metas_equipe"
    ON public.metas_equipe FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
