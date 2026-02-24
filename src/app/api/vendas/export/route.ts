import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const ano = searchParams.get("ano");
    const mes = searchParams.get("mes");
    const categoria = searchParams.get("categoria");
    const busca = searchParams.get("busca");

    let query = supabase.from("vendas").select("*");

    if (ano) query = query.eq("ano", parseInt(ano));
    if (mes) query = query.eq("mes", parseInt(mes));
    if (categoria) query = query.eq("categoria", categoria);
    if (busca) query = query.ilike("nome_cliente", `%${busca}%`);

    query = query.order("ano", { ascending: false }).order("mes", { ascending: false });

    const { data: vendas, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Gerar CSV
    const headers = [
        "ID", "Ano", "Mes", "Cliente", "Codigo", "Produto", "Categoria",
        "Perfil", "Tipo", "Especificacao", "Vigencia", "Valor", "Repasse_Desconto",
        "Valor_Repasse", "Valor_Calculo", "Volume_Horas", "Valor_Hora",
        "Comissao_Pct", "Comissao_Valor", "Observacoes",
    ];

    const rows = vendas?.map((v) =>
        [
            v.id, v.ano, v.mes, v.nome_cliente, v.venda_codigo, v.produto,
            v.categoria, v.perfil, v.tipo, v.especificacao, v.vigencia,
            v.valor, v.repasse_desconto, v.valor_repasse, v.valor_calculo_comissao,
            v.volume_horas, v.valor_por_hora, v.comissao_percentual,
            v.comissao_valor, v.observacoes,
        ]
            .map((val) => {
                const str = String(val ?? "").replace(/"/g, '""');
                return str.includes(",") || str.includes('"') || str.includes("\n")
                    ? `"${str}"`
                    : str;
            })
            .join(",")
    );

    const csv = [headers.join(","), ...(rows || [])].join("\n");

    return new NextResponse(csv, {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="vendas_export.csv"`,
        },
    });
}
