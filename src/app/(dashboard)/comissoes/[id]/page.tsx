import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, DollarSign, ShoppingCart, TrendingUp } from "lucide-react";
import { formatMoneyDecimal, MESES, CORES_CATEGORIA } from "@/lib/utils";
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

function getRoleLabel(venda: Venda, spId: number): string {
    for (const field of SP_FIELDS) {
        if ((venda[field.key as keyof Venda] as number | null) === spId) {
            return field.label;
        }
    }
    return "—";
}

export default async function ComissaoVendedorPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ ano?: string; mes?: string }>;
}) {
    const { id } = await params;
    const search = await searchParams;
    const supabase = await createClient();

    const spId = parseInt(id);

    // Buscar vendedor
    const { data: vendedor } = await supabase
        .from("sales_people")
        .select("*")
        .eq("id", spId)
        .single();

    if (!vendedor) notFound();

    // Ano
    const { data: anosData } = await supabase
        .from("vendas")
        .select("ano")
        .order("ano", { ascending: false });
    const anos = [...new Set(anosData?.map((v) => v.ano) || [])];
    if (anos.length === 0) anos.push(new Date().getFullYear());
    const anoSelecionado = search.ano ? parseInt(search.ano) : anos[0];

    // Vendas que envolvem esse vendedor
    let query = supabase.from("vendas").select("*").eq("ano", anoSelecionado);
    if (search.mes) query = query.eq("mes", parseInt(search.mes));

    const { data: todasVendas } = await query;

    const SP_KEYS = SP_FIELDS.map((f) => f.key);
    const vendasDoVendedor = (todasVendas || []).filter((v) =>
        SP_KEYS.some((key) => (v as Record<string, unknown>)[key] === spId)
    ) as Venda[];

    // Calcular comissão por venda
    const vendasComComissao = vendasDoVendedor.map((v) => {
        const comissaoPorPessoa =
            v.volume_sales_people > 0
                ? Number(v.comissao_valor) / v.volume_sales_people
                : Number(v.comissao_valor);
        const papel = getRoleLabel(v, spId);

        return {
            ...v,
            comissaoIndividual: comissaoPorPessoa,
            papel,
        };
    });

    // KPIs
    const totalComissao = vendasComComissao.reduce((s, v) => s + v.comissaoIndividual, 0);
    const qtdVendas = vendasComComissao.length;
    const comissaoMedia = qtdVendas > 0 ? totalComissao / qtdVendas : 0;

    const kpis = [
        {
            label: "Total Comissão",
            value: formatMoneyDecimal(totalComissao),
            icon: DollarSign,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
        },
        {
            label: "Vendas Participadas",
            value: qtdVendas.toString(),
            icon: ShoppingCart,
            color: "text-blue-600",
            bg: "bg-blue-50",
        },
        {
            label: "Comissão Média / Venda",
            value: formatMoneyDecimal(comissaoMedia),
            icon: TrendingUp,
            color: "text-purple-600",
            bg: "bg-purple-50",
        },
    ];

    // Back URL
    const backParams = new URLSearchParams();
    backParams.set("ano", anoSelecionado.toString());
    if (search.mes) backParams.set("mes", search.mes);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/comissoes?${backParams.toString()}`}>
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{vendedor.nome}</h1>
                    <p className="text-muted-foreground">
                        Comissões de {anoSelecionado}
                        {search.mes ? ` — ${MESES[parseInt(search.mes) - 1]}` : ""}
                        {" · "}
                        <span className="capitalize">{vendedor.cargo}</span>
                    </p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {kpis.map((kpi) => (
                    <Card key={kpi.label} className="overflow-hidden rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                        <CardContent className="p-5">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                                    <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground font-medium">
                                        {kpi.label}
                                    </p>
                                    <p className={`text-2xl font-bold mt-0.5 ${kpi.color}`}>
                                        {kpi.value}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Vendas Table */}
            <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] overflow-hidden">
                <div className="p-4 border-b">
                    <h3 className="font-semibold">Vendas com Participação</h3>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Mês</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Produto</TableHead>
                            <TableHead>Categoria</TableHead>
                            <TableHead>Papel</TableHead>
                            <TableHead className="text-right">Valor da Venda</TableHead>
                            <TableHead className="text-right">Comissão</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {vendasComComissao.map((v) => {
                            const cor = CORES_CATEGORIA[v.categoria];
                            return (
                                <TableRow key={v.id}>
                                    <TableCell className="font-mono text-sm">
                                        {MESES[v.mes - 1]}
                                    </TableCell>
                                    <TableCell className="font-medium max-w-[200px] truncate">
                                        {v.nome_cliente}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {v.produto}
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={`${cor?.tw || "bg-gray-500"} text-white text-xs`}>
                                            {v.categoria}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm">{v.papel}</TableCell>
                                    <TableCell className="text-right font-mono text-sm">
                                        {formatMoneyDecimal(Number(v.valor))}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-[#00C896] font-semibold">
                                        {formatMoneyDecimal(v.comissaoIndividual)}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {vendasComComissao.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                    Nenhuma venda encontrada para o período
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
