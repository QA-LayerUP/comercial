import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Plus, Download, Eye, Search } from "lucide-react";
import { formatMoney, MESES, CORES_CATEGORIA } from "@/lib/utils";
import { getProfile } from "@/lib/actions/auth";

export default async function VendasPage({
    searchParams,
}: {
    searchParams: Promise<{
        ano?: string;
        mes?: string;
        categoria?: string;
        busca?: string;
        page?: string;
    }>;
}) {
    const params = await searchParams;
    const supabase = await createClient();
    const profile = await getProfile();
    const { canCreateVenda, canDownloadComissoes } = await import("@/lib/permissions");
    const canCreate = canCreateVenda(profile);
    const canDownload = canDownloadComissoes(profile);

    const page = parseInt(params.page || "1");
    const perPage = 25;

    let query = supabase.from("vendas").select("*", { count: "exact" });

    if (params.ano) query = query.eq("ano", parseInt(params.ano));
    if (params.mes) query = query.eq("mes", parseInt(params.mes));
    if (params.categoria) query = query.eq("categoria", params.categoria);
    if (params.busca) query = query.ilike("nome_cliente", `%${params.busca}%`);

    query = query
        .order("ano", { ascending: false })
        .order("mes", { ascending: false })
        .order("id", { ascending: false })
        .range((page - 1) * perPage, page * perPage - 1);

    const { data: vendas, count } = await query;
    const totalPages = Math.ceil((count || 0) / perPage);

    // Filtros disponíveis
    const { data: anosData } = await supabase
        .from("vendas")
        .select("ano")
        .order("ano", { ascending: false });
    const anos = [...new Set(anosData?.map((v) => v.ano))];

    const { data: catsData } = await supabase
        .from("vendas")
        .select("categoria")
        .order("categoria");
    const categorias = [...new Set(catsData?.map((v) => v.categoria))];

    // Build filter URL
    function buildUrl(overrides: Record<string, string>) {
        const p = new URLSearchParams();
        if (params.ano) p.set("ano", params.ano);
        if (params.mes) p.set("mes", params.mes);
        if (params.categoria) p.set("categoria", params.categoria);
        if (params.busca) p.set("busca", params.busca);
        Object.entries(overrides).forEach(([k, v]) => {
            if (v) p.set(k, v);
            else p.delete(k);
        });
        return `/vendas?${p.toString()}`;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Vendas</h1>
                    <p className="text-muted-foreground text-sm">{count || 0} vendas encontradas</p>
                </div>
                <div className="flex gap-2">
                    {canDownload && (
                        <Button variant="outline" size="sm" className="border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white" asChild>
                            <a href={`/api/vendas/export?${new URLSearchParams(Object.fromEntries(Object.entries({ ano: params.ano, mes: params.mes, categoria: params.categoria, busca: params.busca }).filter((entry): entry is [string, string] => entry[1] !== undefined))).toString()}`}>
                                <Download className="w-4 h-4 mr-2" />
                                Exportar CSV
                            </a>
                        </Button>
                    )}
                    {canCreate && (
                        <Button size="sm" className="bg-[#E91E8C] hover:bg-[#D4177F] text-white" asChild>
                            <Link href="/vendas/nova">
                                <Plus className="w-4 h-4 mr-2" />
                                Nova Venda
                            </Link>
                        </Button>
                    )}
                </div>
            </div>

            {/* Filtros — Grid Layout */}
            <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-0 bg-white">
                <form className="p-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                        {/* Busca — spans wider on large */}
                        <div className="lg:col-span-2 space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Busca</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    name="busca"
                                    placeholder="Buscar por cliente..."
                                    defaultValue={params.busca}
                                    className="pl-9 h-10 bg-[#F5F6FA] border-transparent focus:bg-white focus:border-[#FFC857]"
                                />
                            </div>
                        </div>
                        {/* Ano */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Ano</label>
                            <select
                                name="ano"
                                defaultValue={params.ano || ""}
                                className="w-full h-10 rounded-lg border-transparent bg-[#F5F6FA] px-3 text-sm transition-colors focus:bg-white focus:border-[#FFC857] focus:ring-2 focus:ring-[#FFC857]/20 outline-none"
                            >
                                <option value="">Todos</option>
                                {anos.map((a) => (
                                    <option key={a} value={a}>{a}</option>
                                ))}
                            </select>
                        </div>
                        {/* Mês */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Mês</label>
                            <select
                                name="mes"
                                defaultValue={params.mes || ""}
                                className="w-full h-10 rounded-lg border-transparent bg-[#F5F6FA] px-3 text-sm transition-colors focus:bg-white focus:border-[#FFC857] focus:ring-2 focus:ring-[#FFC857]/20 outline-none"
                            >
                                <option value="">Todos</option>
                                {MESES.map((m, i) => (
                                    <option key={i} value={i + 1}>{m}</option>
                                ))}
                            </select>
                        </div>
                        {/* Categoria */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Categoria</label>
                            <select
                                name="categoria"
                                defaultValue={params.categoria || ""}
                                className="w-full h-10 rounded-lg border-transparent bg-[#F5F6FA] px-3 text-sm transition-colors focus:bg-white focus:border-[#FFC857] focus:ring-2 focus:ring-[#FFC857]/20 outline-none"
                            >
                                <option value="">Todas</option>
                                {categorias.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    {/* Action row */}
                    <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[#F1F1F1]">
                        <Button type="submit" size="sm" className="bg-[#E91E8C] hover:bg-[#D4177F] text-white px-6">
                            <Search className="w-4 h-4 mr-1.5" /> Filtrar
                        </Button>
                        <Button type="button" variant="ghost" size="sm" className="text-muted-foreground hover:text-[#1A1A1A]" asChild>
                            <Link href="/vendas">Limpar filtros</Link>
                        </Button>
                    </div>
                </form>
            </Card>

            {/* Tabela */}
            <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] overflow-hidden border-0">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-[#F5F6FA] hover:bg-[#F5F6FA]">
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#616161]">Período</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#616161]">Cliente</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#616161]">Categoria</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#616161]">Produto</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#616161] text-right">Valor</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#616161] text-right">Comissão</TableHead>
                            <TableHead className="w-12"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {vendas?.map((v) => {
                            const cor = CORES_CATEGORIA[v.categoria];
                            return (
                                <TableRow key={v.id} className="group hover:bg-[#F9F9FB] transition-colors">
                                    <TableCell className="font-mono text-sm text-muted-foreground">
                                        {MESES[v.mes - 1]?.slice(0, 3)}/{v.ano}
                                    </TableCell>
                                    <TableCell>
                                        <Link href={`/vendas/${v.id}`} className="font-medium text-sm hover:text-[#E91E8C] transition-colors max-w-[220px] truncate block">
                                            {v.nome_cliente}
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <span
                                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                            style={{
                                                backgroundColor: (cor?.border || "#999") + "18",
                                                color: cor?.border || "#666",
                                            }}
                                        >
                                            {v.categoria}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground max-w-[180px] truncate">
                                        {v.produto}
                                    </TableCell>
                                    <TableCell className="text-right font-mono font-medium text-sm">
                                        {formatMoney(Number(v.valor))}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-sm text-muted-foreground">
                                        {Number(v.comissao_percentual).toFixed(1)}%
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" asChild className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Link href={`/vendas/${v.id}`}>
                                                <Eye className="w-4 h-4 text-muted-foreground" />
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {(!vendas || vendas.length === 0) && (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                                    Nenhuma venda encontrada
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>

            {/* Paginação */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3">
                    {page > 1 && (
                        <Button variant="outline" size="sm" className="rounded-lg" asChild>
                            <Link href={buildUrl({ page: (page - 1).toString() })}>← Anterior</Link>
                        </Button>
                    )}
                    <span className="text-sm text-muted-foreground font-medium px-3">
                        {page} / {totalPages}
                    </span>
                    {page < totalPages && (
                        <Button variant="outline" size="sm" className="rounded-lg" asChild>
                            <Link href={buildUrl({ page: (page + 1).toString() })}>Próxima →</Link>
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
