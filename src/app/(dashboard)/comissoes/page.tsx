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
import { DollarSign, Users, ShoppingCart, Download, Eye, TrendingUp } from "lucide-react";
import { formatMoneyDecimal } from "@/lib/utils";
import { ComissoesFilters } from "@/components/comissoes/comissoes-filters";
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

function calcularComissoesPorVendedor(vendas: Venda[], salesPeople: SalesPerson[]): VendedorResumo[] {
    const spMap = new Map<number, string>();
    salesPeople.forEach((sp) => spMap.set(sp.id, sp.nome));

    const resumo = new Map<number, VendedorResumo>();

    for (const venda of vendas) {
        const comissaoPorPessoa =
            venda.volume_sales_people > 0
                ? Number(venda.comissao_valor) / venda.volume_sales_people
                : Number(venda.comissao_valor);

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

            const existing = resumo.get(spId);
            if (existing) {
                existing.totalComissao += comissaoPorPessoa;
                existing.qtdVendas += 1;
            } else {
                resumo.set(spId, {
                    id: spId,
                    nome,
                    totalComissao: comissaoPorPessoa,
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
    const mediaPorVendedor = vendedoresComComissao > 0 ? totalComissoes / vendedoresComComissao : 0;

    // Build export URL
    const exportParams = new URLSearchParams();
    exportParams.set("ano", anoSelecionado.toString());
    if (params.mes) exportParams.set("mes", params.mes);
    if (params.vendedor) exportParams.set("vendedor", params.vendedor);

    // Find max comissao for progress bar proportion
    const maxComissao = resumoFinal.length > 0 ? Math.max(...resumoFinal.map(v => v.totalComissao)) : 1;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Comissões</h1>
                    <p className="text-sm text-muted-foreground">
                        Valores de comissão por vendedor — {anoSelecionado}
                    </p>
                </div>
                <Button className="bg-[#E91E8C] hover:bg-[#D4177F] text-white" size="sm" asChild>
                    <a href={`/api/comissoes/export?${exportParams.toString()}`}>
                        <Download className="w-4 h-4 mr-2" />
                        Exportar CSV
                    </a>
                </Button>
            </div>

            {/* Filters */}
            <ComissoesFilters anos={anos} vendedores={(salesPeople || []) as SalesPerson[]} />

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Comissões - Hero */}
                <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-0 bg-[#FFC857] overflow-hidden">
                    <CardContent className="p-5">
                        <p className="text-xs text-[#1A1A1A]/50 uppercase tracking-wider font-medium">Total Comissões</p>
                        <p className="text-2xl font-bold font-mono text-[#1A1A1A] mt-1">
                            {formatMoneyDecimal(totalComissoes)}
                        </p>
                    </CardContent>
                </Card>

                {/* Vendedores */}
                <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-0">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Vendedores</p>
                                <p className="text-2xl font-bold mt-1">{vendedoresComComissao}</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-[#3A86FF]/10 flex items-center justify-center">
                                <Users className="w-5 h-5 text-[#3A86FF]" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Vendas Processadas */}
                <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-0">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Vendas</p>
                                <p className="text-2xl font-bold mt-1">{vendasProcessadas}</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-[#E91E8C]/10 flex items-center justify-center">
                                <ShoppingCart className="w-5 h-5 text-[#E91E8C]" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Média por Vendedor */}
                <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-0">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Média / Vendedor</p>
                                <p className="text-2xl font-bold font-mono mt-1">{formatMoneyDecimal(mediaPorVendedor)}</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-[#00C896]/10 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-[#00C896]" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Table */}
            <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] overflow-hidden border-0">
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#F1F1F1]">
                    <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-[#00C896]" />
                        <h3 className="font-semibold text-sm">Resumo por Vendedor</h3>
                    </div>
                    <span className="text-xs text-muted-foreground">
                        {resumoFinal.length} vendedor{resumoFinal.length !== 1 ? "es" : ""}
                    </span>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow className="bg-[#F5F6FA] hover:bg-[#F5F6FA]">
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#616161]">Vendedor</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#616161] text-center">Vendas</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#616161]">Proporção</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#616161] text-right">Total Comissão</TableHead>
                            <TableHead className="w-12"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {resumoFinal.map((v, idx) => {
                            const pct = maxComissao > 0 ? (v.totalComissao / maxComissao) * 100 : 0;
                            return (
                                <TableRow key={v.id} className="group hover:bg-[#F9F9FB] transition-colors">
                                    <TableCell>
                                        <Link
                                            href={`/comissoes/${v.id}?ano=${anoSelecionado}${params.mes ? `&mes=${params.mes}` : ""}`}
                                            className="font-medium text-sm hover:text-[#E91E8C] transition-colors"
                                        >
                                            {v.nome}
                                        </Link>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span className="inline-flex items-center justify-center w-8 h-6 rounded-full bg-[#F5F6FA] text-xs font-medium">
                                            {v.qtdVendas}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-2 bg-[#F5F6FA] rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-[#E91E8C]"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                            <span className="text-xs text-muted-foreground w-10 text-right">
                                                {totalComissoes > 0 ? ((v.totalComissao / totalComissoes) * 100).toFixed(0) : 0}%
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-mono font-semibold text-sm text-[#00C896]">
                                        {formatMoneyDecimal(v.totalComissao)}
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" asChild>
                                            <Link href={`/comissoes/${v.id}?ano=${anoSelecionado}${params.mes ? `&mes=${params.mes}` : ""}`}>
                                                <Eye className="w-4 h-4 text-muted-foreground" />
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {resumoFinal.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                                    <div className="flex flex-col items-center gap-2">
                                        <DollarSign className="w-8 h-8 text-muted-foreground/30" />
                                        <p>Nenhuma comissão encontrada para o período selecionado</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
