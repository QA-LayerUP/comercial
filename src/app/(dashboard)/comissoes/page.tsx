import Link from "next/link";
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
import { DollarSign, Users, ShoppingCart, Download } from "lucide-react";
import { formatMoneyDecimal } from "@/lib/utils";
import { ComissoesFilters } from "@/components/comissoes/comissoes-filters";
import { getProfile } from "@/lib/actions/auth";
import { canDownloadComissoes } from "@/lib/permissions";
import type { Venda, SalesPerson } from "@/lib/types/database";

// Campos de vendedor na venda
const SP_FIELDS = [
    "estrategia1_id",
    "estrategia2_id",
    "vendedor1_id",
    "vendedor2_id",
    "gestao_projetos_id",
    "customer_success_id",
    "sdr_id",
] as const;

interface VendedorResumo {
    id: number;
    nome: string;
    totalComissao: number;
    qtdVendas: number;
}

function getComissaoParaPessoa(venda: Venda, spId: number): number {
    // comissao_valor já está gravado por vendedor; SDR recebe 5% do total
    const comissaoTotal = Number(venda.comissao_valor) * (venda.volume_sales_people || 1);
    return venda.sdr_id === spId ? comissaoTotal * 0.05 : Number(venda.comissao_valor);
}

function calcularComissoesPorVendedor(vendas: Venda[], salesPeople: SalesPerson[]): VendedorResumo[] {
    const spMap = new Map<number, string>();
    salesPeople.forEach((sp) => spMap.set(sp.id, sp.nome));

    const resumo = new Map<number, VendedorResumo>();

    for (const venda of vendas) {
        const idsEnvolvidos = new Set<number>();
        for (const field of SP_FIELDS) {
            const spId = venda[field as keyof Venda] as number | null;
            if (spId && !idsEnvolvidos.has(spId)) {
                idsEnvolvidos.add(spId);
            }
        }

        for (const spId of idsEnvolvidos) {
            const nome = spMap.get(spId);
            if (!nome) continue;

            const comissao = getComissaoParaPessoa(venda, spId);

            const existing = resumo.get(spId);
            if (existing) {
                existing.totalComissao += comissao;
                existing.qtdVendas += 1;
            } else {
                resumo.set(spId, {
                    id: spId,
                    nome,
                    totalComissao: comissao,
                    qtdVendas: 1,
                });
            }
        }
    }

    return Array.from(resumo.values()).sort((a, b) => b.totalComissao - a.totalComissao);
}

export default async function ComissoesPage({
    searchParams,
}: {
    searchParams: Promise<{ ano?: string; mes?: string; vendedor?: string }>;
}) {
    const params = await searchParams;
    const profile = await getProfile();
    const canDownload = canDownloadComissoes(profile);
    const supabase = await createClient();

    // Anos disponíveis
    const { data: anosData } = await supabase
        .from("vendas")
        .select("ano")
        .order("ano", { ascending: false });
    const anos = [...new Set(anosData?.map((v) => v.ano) || [])];
    if (anos.length === 0) anos.push(new Date().getFullYear());

    const anoSelecionado = params.ano ? parseInt(params.ano) : anos[0];

    // Sales people
    const { data: salesPeople } = await supabase
        .from("sales_people")
        .select("*")
        .eq("ativo", true)
        .order("nome");

    // Vendas filtradas
    let query = supabase.from("vendas").select("*").eq("ano", anoSelecionado);
    if (params.mes) query = query.eq("mes", parseInt(params.mes));

    const { data: vendas } = await query;

    // Se filtro de vendedor, filtrar vendas que envolvem esse vendedor
    let vendasFiltradas = vendas || [];
    const vendedorFiltro = params.vendedor ? parseInt(params.vendedor) : null;
    if (vendedorFiltro) {
        vendasFiltradas = vendasFiltradas.filter((v) =>
            SP_FIELDS.some((f) => (v as Record<string, unknown>)[f] === vendedorFiltro)
        );
    }

    // Calcular resumo
    const resumoVendedores = calcularComissoesPorVendedor(
        vendasFiltradas as Venda[],
        (salesPeople || []) as SalesPerson[]
    );

    // Se filtro de vendedor, mostrar só ele
    const resumoFinal = vendedorFiltro
        ? resumoVendedores.filter((r) => r.id === vendedorFiltro)
        : resumoVendedores;

    // KPIs
    const totalComissoes = resumoFinal.reduce((s, v) => s + v.totalComissao, 0);
    const vendedoresComComissao = resumoFinal.filter((v) => v.totalComissao > 0).length;
    const vendasProcessadas = vendasFiltradas.length;

    // Build export URL
    const exportParams = new URLSearchParams();
    exportParams.set("ano", anoSelecionado.toString());
    if (params.mes) exportParams.set("mes", params.mes);
    if (params.vendedor) exportParams.set("vendedor", params.vendedor);

    const kpis = [
        {
            label: "Total Comissões",
            value: formatMoneyDecimal(totalComissoes),
            icon: DollarSign,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
        },
        {
            label: "Vendedores com comissão",
            value: vendedoresComComissao.toString(),
            icon: Users,
            color: "text-blue-600",
            bg: "bg-blue-50",
        },
        {
            label: "Vendas processadas",
            value: vendasProcessadas.toString(),
            icon: ShoppingCart,
            color: "text-purple-600",
            bg: "bg-purple-50",
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Comissões</h1>
                    <p className="text-muted-foreground">
                        Valores de comissão por vendedor para envio ao DP
                    </p>
                </div>
                {canDownload && (
                    <Button className="bg-[#E91E8C] hover:bg-[#D4177F] text-white" size="sm" asChild>
                        <a href={`/api/comissoes/export?${exportParams.toString()}`}>
                            <Download className="w-4 h-4 mr-2" />
                            Exportar CSV
                        </a>
                    </Button>
                )}
            </div>

            {/* Filters */}
            <ComissoesFilters anos={anos} vendedores={(salesPeople || []) as SalesPerson[]} />

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

            {/* Table */}
            <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] overflow-hidden">
                <div className="p-4 border-b">
                    <h3 className="font-semibold">Resumo por Vendedor</h3>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Vendedor</TableHead>
                            <TableHead className="text-center">Vendas</TableHead>
                            <TableHead className="text-right">Total Comissão</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {resumoFinal.map((v) => (
                            <TableRow key={v.id} className="group cursor-pointer">
                                <TableCell>
                                    <Link
                                        href={`/comissoes/${v.id}?ano=${anoSelecionado}${params.mes ? `&mes=${params.mes}` : ""}`}
                                        className="font-medium hover:underline"
                                    >
                                        {v.nome}
                                    </Link>
                                </TableCell>
                                <TableCell className="text-center">{v.qtdVendas}</TableCell>
                                <TableCell className="text-right font-mono text-[#00C896] font-semibold">
                                    {formatMoneyDecimal(v.totalComissao)}
                                </TableCell>
                            </TableRow>
                        ))}
                        {resumoFinal.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                                    Nenhuma comissão encontrada para o período selecionado
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
