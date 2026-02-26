import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/actions/auth";
import { canDownloadComissoes } from "@/lib/permissions";
import type { Venda } from "@/lib/types/database";

const SP_FIELDS = [
    { key: "estrategia1_id", label: "Estratégia" },
    { key: "estrategia2_id", label: "Estratégia" },
    { key: "vendedor1_id", label: "Vendedor" },
    { key: "vendedor2_id", label: "Vendedor" },
    { key: "gestao_projetos_id", label: "Gestão de Projetos" },
    { key: "customer_success_id", label: "Customer Success" },
    { key: "sdr_id", label: "SDR" },
] as const;

const MESES = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function getRoleLabel(venda: Venda, spId: number): string {
    for (const field of SP_FIELDS) {
        if ((venda[field.key as keyof Venda] as number | null) === spId) {
            return field.label;
        }
    }
    return "—";
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const profile = await getProfile();
    if (!canDownloadComissoes(profile)) {
        return NextResponse.json({ error: "Sem permissão para exportar comissões." }, { status: 403 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const supabase = await createClient();

    const spId = parseInt(id);
    const ano = searchParams.get("ano");
    const mes = searchParams.get("mes");

    if (!ano) {
        return NextResponse.json({ error: "Ano é obrigatório" }, { status: 400 });
    }

    // Buscar vendedor
    const { data: vendedor } = await supabase
        .from("sales_people")
        .select("nome")
        .eq("id", spId)
        .single();

    if (!vendedor) {
        return NextResponse.json({ error: "Vendedor não encontrado" }, { status: 404 });
    }

    // Buscar vendas
    let query = supabase.from("vendas").select("*").eq("ano", parseInt(ano));
    if (mes) query = query.eq("mes", parseInt(mes));

    const { data: todasVendas, error } = await query;
    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Filtrar vendas do vendedor
    const SP_KEYS = SP_FIELDS.map((f) => f.key);
    const vendasDoVendedor = (todasVendas || []).filter((v) =>
        SP_KEYS.some((key) => (v as Record<string, unknown>)[key] === spId)
    ) as Venda[];

    // Build CSV
    const headers = ["Mês", "Cliente", "Produto", "Categoria", "Papel", "Valor da Venda", "Comissão"];

    const csvRows = vendasDoVendedor.map((v) => {
        const comissaoTotal = Number(v.comissao_valor) * (v.volume_sales_people || 1);
        const comissaoIndividual = v.sdr_id === spId
            ? comissaoTotal * 0.05
            : Number(v.comissao_valor);

        const papel = getRoleLabel(v, spId);

        return [
            `"${MESES[v.mes - 1]}"`,
            `"${v.nome_cliente}"`,
            `"${v.produto}"`,
            `"${v.categoria}"`,
            `"${papel}"`,
            Number(v.valor).toFixed(2).replace(".", ","),
            comissaoIndividual.toFixed(2).replace(".", ","),
        ].join(",");
    });

    const csv = [headers.join(","), ...csvRows].join("\n");

    const filename = `comissoes_${vendedor.nome.replace(/\s+/g, "_")}_${ano}${mes ? `_mes${mes}` : ""}.csv`;

    return new NextResponse(csv, {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="${filename}"`,
        },
    });
}
