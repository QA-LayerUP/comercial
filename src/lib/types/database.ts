export interface Profile {
    id: string;
    nome: string;
    role: "admin" | "comercial" | "visitante";
    ativo: boolean;
    created_at: string;
}

export interface Cliente {
    id: number;
    confidencialidade: string | null;
    nome: string;
    cnpj_cpf: string | null;
    contato_nome: string | null;
    contato_email: string | null;
    contato_telefone: string | null;
    contrato_ativo: boolean;
    data_primeiro_contrato: string | null;
    data_renovacao: string | null;
    link_contrato: string | null;
    link_proposta: string | null;
    observacoes: string | null;
    created_at: string;
    updated_at: string;
}

export interface SalesPerson {
    id: number;
    nome: string;
    cargo: "SDR" | "Estrategia" | "Vendedor" | "Gestao de projetos" | "Customer Success";
    ativo: boolean;
    created_at: string;
}

export interface RegraComissao {
    id: number;
    produto: string;
    categoria: string;
    perfil: string;
    tipo: string;
    especificacao: string;
    vigencia: string;
    comissao_percentual: number;
}

export interface DropdownOption {
    id: number;
    produto: string;
    categoria: string | null;
    perfil: string | null;
    tipo: string | null;
    especificacao: string | null;
    vigencia: string | null;
}

export interface Venda {
    id: number;
    ano: number;
    mes: number;
    cliente_id: number | null;
    nome_cliente: string;
    venda_codigo: string | null;
    produto: string;
    categoria: string;
    perfil: string;
    tipo: string;
    especificacao: string;
    vigencia: string | null;
    valor: number;
    repasse_desconto: string | null;
    valor_repasse: number;
    valor_calculo_comissao: number;
    volume_horas: number;
    valor_por_hora: number;
    volume_sales_people: number;
    estrategia1_id: number | null;
    estrategia2_id: number | null;
    vendedor1_id: number | null;
    vendedor2_id: number | null;
    gestao_projetos_id: number | null;
    customer_success_id: number | null;
    sdr_id: number | null;
    comissao_percentual: number;
    comissao_valor: number;
    observacoes: string | null;
    created_at: string;
    updated_at: string;
    created_by: string | null;
}

export interface Meta {
    id: number;
    ano: number;
    categoria: string;
    mes: number | null;
    valor_meta: number;
}
