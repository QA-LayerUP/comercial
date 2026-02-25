import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const SP_FIELDS = [
    "estrategia1_id",
    "estrategia2_id",
    "vendedor1_id",
    "vendedor2_id",
    "gestao_projetos_id",
    "customer_success_id",
    "sdr_id",
];

export async function GET(request: Request) {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const ano = searchParams.get("ano");
    const mes = searchParams.get("mes");
    const vendedorFilter = searchParams.get("vendedor");

    // Vendas
    let query = supabase.from("vendas").select("*");
    if (ano) query = query.eq("ano", parseInt(ano));
    if (mes) query = query.eq("mes", parseInt(mes));

    const { data: vendas, error } = await query;
    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Sales people
    const { data: salesPeople } = await supabase
        .from("sales_people")
        .select("id, nome")
        .eq("ativo", true);

    const spMap = new Map<number, string>();
    salesPeople?.forEach((sp) => spMap.set(sp.id, sp.nome));

    // Calcular comissões
    const resumo = new Map<number, { nome: string; vendas: number; total: number }>();

    for (const venda of vendas || []) {
        const comissaoPorPessoa =
            (venda.volume_sales_people || 1) > 0
                ? Number(venda.comissao_valor) / (venda.volume_sales_people || 1)
                : Number(venda.comissao_valor);

        const idsEnvolvidos = new Set<number>();
        for (const field of SP_FIELDS) {
            const spId = (venda as Record<string, unknown>)[field] as number | null;
            if (spId && !idsEnvolvidos.has(spId)) {
                idsEnvolvidos.add(spId);
            }
        }

        for (const spId of idsEnvolvidos) {
            const nome = spMap.get(spId);
            if (!nome) continue;

            const existing = resumo.get(spId);
            if (existing) {
                existing.total += comissaoPorPessoa;
                existing.vendas += 1;
            } else {
                resumo.set(spId, { nome, vendas: 1, total: comissaoPorPessoa });
            }
        }
    }

    let rows = Array.from(resumo.entries()).map(([id, data]) => ({
        id,
        ...data,
    }));

    // Filter by vendedor
    if (vendedorFilter) {
        rows = rows.filter((r) => r.id === parseInt(vendedorFilter));
    }

    // Sort by total desc
    rows.sort((a, b) => b.total - a.total);

    // Build CSV
    const headers = ["Vendedor", "Vendas", "Total Comissão"];
    const csvRows = rows.map((r) =>
        [
            `"${r.nome}"`,
            r.vendas,
            r.total.toFixed(2).replace(".", ","),
        ].join(",")
    );

    const csv = [headers.join(","), ...csvRows].join("\n");

    const filename = `comissoes_${ano || "todos"}${mes ? `_mes${mes}` : ""}.csv`;

    return new NextResponse(csv, {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="${filename}"`,
        },
    });
}
