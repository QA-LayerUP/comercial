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
    const isAdmin = profile?.role === "admin";

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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Vendas</h1>
                    <p className="text-muted-foreground">{count || 0} vendas encontradas</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="border-[#0A1F44] text-[#0A1F44] hover:bg-[#0A1F44] hover:text-white" asChild>
                        <a href={`/api/vendas/export?${new URLSearchParams(Object.fromEntries(Object.entries({ ano: params.ano, mes: params.mes, categoria: params.categoria, busca: params.busca }).filter((entry): entry is [string, string] => entry[1] !== undefined))).toString()}`}>
                            <Download className="w-4 h-4 mr-2" />
                            Exportar CSV
                        </a>
                    </Button>
                    {isAdmin && (
                        <Button size="sm" className="bg-[#8A2BE2] hover:bg-[#7B27CC] text-white" asChild>
                            <Link href="/vendas/nova">
                                <Plus className="w-4 h-4 mr-2" />
                                Nova Venda
                            </Link>
                        </Button>
                    )}
                </div>
            </div>

            {/* Filtros */}
            <Card className="p-4 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                <form className="flex flex-wrap gap-3 items-end">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-muted-foreground">Busca</label>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                name="busca"
                                placeholder="Nome do cliente..."
                                defaultValue={params.busca}
                                className="pl-8 w-56"
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-muted-foreground">Ano</label>
                        <select
                            name="ano"
                            defaultValue={params.ano || ""}
                            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                        >
                            <option value="">Todos</option>
                            {anos.map((a) => (
                                <option key={a} value={a}>{a}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-muted-foreground">Mês</label>
                        <select
                            name="mes"
                            defaultValue={params.mes || ""}
                            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                        >
                            <option value="">Todos</option>
                            {MESES.map((m, i) => (
                                <option key={i} value={i + 1}>{m}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-muted-foreground">Categoria</label>
                        <select
                            name="categoria"
                            defaultValue={params.categoria || ""}
                            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                        >
                            <option value="">Todas</option>
                            {categorias.map((c) => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                    <Button type="submit" size="sm" className="bg-[#8A2BE2] hover:bg-[#7B27CC] text-white">
                        <Search className="w-4 h-4 mr-1" /> Filtrar
                    </Button>
                    <Button type="button" variant="ghost" size="sm" asChild>
                        <Link href="/vendas">Limpar</Link>
                    </Button>
                </form>
            </Card>

            {/* Tabela */}
            <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Ano/Mês</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Categoria</TableHead>
                            <TableHead>Produto</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                            <TableHead className="text-right">Comissão</TableHead>
                            <TableHead className="w-12"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {vendas?.map((v) => {
                            const cor = CORES_CATEGORIA[v.categoria];
                            return (
                                <TableRow key={v.id} className="group">
                                    <TableCell className="font-mono text-sm">
                                        {v.ano}/{String(v.mes).padStart(2, "0")}
                                    </TableCell>
                                    <TableCell className="font-medium max-w-[200px] truncate">
                                        {v.nome_cliente}
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={`${cor?.tw || "bg-gray-500"} text-white text-xs`}>
                                            {v.categoria}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {v.produto}
                                    </TableCell>
                                    <TableCell className="text-right font-mono">
                                        {formatMoney(Number(v.valor))}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-sm">
                                        {Number(v.comissao_percentual).toFixed(1)}%
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" asChild className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Link href={`/vendas/${v.id}`}>
                                                <Eye className="w-4 h-4" />
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {(!vendas || vendas.length === 0) && (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                    Nenhuma venda encontrada
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>

            {/* Paginação */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    {page > 1 && (
                        <Button variant="outline" size="sm" asChild>
                            <Link href={buildUrl({ page: (page - 1).toString() })}>Anterior</Link>
                        </Button>
                    )}
                    <span className="text-sm text-muted-foreground">
                        Página {page} de {totalPages}
                    </span>
                    {page < totalPages && (
                        <Button variant="outline" size="sm" asChild>
                            <Link href={buildUrl({ page: (page + 1).toString() })}>Próxima</Link>
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
