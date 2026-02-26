import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Plus, Search, Users, CheckCircle2, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { getProfile } from "@/lib/actions/auth";
import { canCreateCliente } from "@/lib/permissions";

function initials(nome: string) {
    const parts = nome.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_COLORS = [
    "bg-[#E91E8C]/15 text-[#E91E8C]",
    "bg-[#3A86FF]/15 text-[#3A86FF]",
    "bg-[#8B5CF6]/15 text-[#8B5CF6]",
    "bg-[#00C896]/15 text-[#00C896]",
    "bg-[#FFC857]/20 text-[#B8882A]",
];

function avatarColor(id: number) {
    return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

export default async function ClientesPage({
    searchParams,
}: {
    searchParams: Promise<{ busca?: string; ativo?: string; page?: string }>;
}) {
    const params = await searchParams;
    const supabase = await createClient();
    const profile = await getProfile();
    const canCreate = canCreateCliente(profile);

    const page = parseInt(params.page || "1");
    const perPage = 25;

    // KPI counts (parallel)
    const [{ count: totalCount }, { count: ativoCount }] = await Promise.all([
        supabase.from("clientes").select("*", { count: "exact", head: true }),
        supabase.from("clientes").select("*", { count: "exact", head: true }).eq("contrato_ativo", true),
    ]);

    const inativoCount = (totalCount || 0) - (ativoCount || 0);

    // Filtered list
    let query = supabase.from("clientes").select("*", { count: "exact" });

    if (params.busca) {
        query = query.or(`nome.ilike.%${params.busca}%,cnpj_cpf.ilike.%${params.busca}%`);
    }
    if (params.ativo === "1") query = query.eq("contrato_ativo", true);
    else if (params.ativo === "0") query = query.eq("contrato_ativo", false);

    query = query.order("nome").range((page - 1) * perPage, page * perPage - 1);

    const { data: clientes, count } = await query;
    const totalPages = Math.ceil((count || 0) / perPage);

    // Build query string helper
    function buildQuery(overrides: Record<string, string | undefined>) {
        const merged = {
            busca: params.busca,
            ativo: params.ativo,
            page: String(page),
            ...overrides,
        };
        const qs = Object.entries(merged)
            .filter(([, v]) => v)
            .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
            .join("&");
        return qs ? `?${qs}` : "";
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
                    <p className="text-sm text-muted-foreground">{totalCount || 0} clientes cadastrados</p>
                </div>
                {canCreate && (
                    <Button className="bg-[#E91E8C] hover:bg-[#D4177F] text-white shrink-0" size="sm" asChild>
                        <Link href="/clientes/novo">
                            <Plus className="w-4 h-4 mr-2" /> Novo Cliente
                        </Link>
                    </Button>
                )}
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-3 gap-4">
                <Card className="rounded-2xl border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                    <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total</p>
                            <span className="p-1.5 bg-[#3A86FF]/10 rounded-lg">
                                <Users className="w-4 h-4 text-[#3A86FF]" />
                            </span>
                        </div>
                        <p className="text-3xl font-bold">{totalCount || 0}</p>
                        <p className="text-xs text-muted-foreground mt-1">clientes</p>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                    <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Ativos</p>
                            <span className="p-1.5 bg-[#00C896]/10 rounded-lg">
                                <CheckCircle2 className="w-4 h-4 text-[#00C896]" />
                            </span>
                        </div>
                        <p className="text-3xl font-bold text-[#00C896]">{ativoCount || 0}</p>
                        <p className="text-xs text-muted-foreground mt-1">contrato ativo</p>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                    <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Inativos</p>
                            <span className="p-1.5 bg-muted rounded-lg">
                                <XCircle className="w-4 h-4 text-muted-foreground" />
                            </span>
                        </div>
                        <p className="text-3xl font-bold text-muted-foreground">{inativoCount}</p>
                        <p className="text-xs text-muted-foreground mt-1">sem contrato ativo</p>
                    </CardContent>
                </Card>
            </div>

            {/* Search + Filter */}
            <Card className="rounded-2xl border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                <CardContent className="p-4">
                    <form className="flex flex-wrap gap-3 items-center">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                name="busca"
                                placeholder="Buscar por nome ou CNPJ/CPF..."
                                defaultValue={params.busca}
                                className="pl-9 rounded-xl bg-muted/50 border-0 focus-visible:ring-1"
                            />
                        </div>

                        {/* Ativo filter pills */}
                        <div className="flex gap-1.5">
                            {[
                                { value: "", label: "Todos" },
                                { value: "1", label: "Ativos" },
                                { value: "0", label: "Inativos" },
                            ].map((opt) => (
                                <Link
                                    key={opt.value}
                                    href={`/clientes${buildQuery({ ativo: opt.value || undefined, page: "1" })}`}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                                        (params.ativo || "") === opt.value
                                            ? "bg-[#E91E8C] text-white shadow-sm"
                                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                                    }`}
                                >
                                    {opt.label}
                                </Link>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <Button type="submit" size="sm" className="rounded-xl">
                                <Search className="w-3.5 h-3.5 mr-1.5" /> Buscar
                            </Button>
                            {params.busca && (
                                <Button variant="ghost" size="sm" className="rounded-xl" asChild>
                                    <Link href="/clientes">Limpar</Link>
                                </Button>
                            )}
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Table */}
            <Card className="rounded-2xl border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)] overflow-hidden">
                {count !== null && count !== undefined && (
                    <div className="px-5 py-3 border-b bg-muted/20 flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                            {count} {count === 1 ? "resultado" : "resultados"}
                            {params.busca && <> para <strong>"{params.busca}"</strong></>}
                        </p>
                    </div>
                )}
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Cliente</TableHead>
                            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground font-semibold hidden md:table-cell">CNPJ/CPF</TableHead>
                            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground font-semibold hidden sm:table-cell">Contato</TableHead>
                            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Status</TableHead>
                            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground font-semibold hidden lg:table-cell">Renovação</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {clientes?.map((c) => (
                            <TableRow key={c.id} className="relative hover:bg-muted/30 cursor-pointer transition-colors">
                                {/* Full-row link overlay */}
                                <Link
                                    href={`/clientes/${c.id}`}
                                    className="absolute inset-0 z-0"
                                    aria-label={`Ver ${c.nome}`}
                                />
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarColor(c.id)}`}>
                                            {initials(c.nome)}
                                        </div>
                                        <span className="font-medium text-sm">{c.nome}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="hidden md:table-cell font-mono text-xs text-muted-foreground">
                                    {c.cnpj_cpf || <span className="text-muted-foreground/50">—</span>}
                                </TableCell>
                                <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                                    {c.contato_nome || <span className="text-muted-foreground/50">—</span>}
                                </TableCell>
                                <TableCell>
                                    <span
                                        className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                                            c.contrato_ativo
                                                ? "bg-[#00C896]/10 text-[#00C896]"
                                                : "bg-muted text-muted-foreground"
                                        }`}
                                    >
                                        <span className={`w-1.5 h-1.5 rounded-full ${c.contrato_ativo ? "bg-[#00C896]" : "bg-muted-foreground/50"}`} />
                                        {c.contrato_ativo ? "Ativo" : "Inativo"}
                                    </span>
                                </TableCell>
                                <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                                    {c.data_renovacao
                                        ? new Date(c.data_renovacao + "T00:00:00").toLocaleDateString("pt-BR")
                                        : <span className="text-muted-foreground/50">—</span>}
                                </TableCell>
                            </TableRow>
                        ))}
                        {(!clientes || clientes.length === 0) && (
                            <TableRow>
                                <TableCell colSpan={5} className="py-16 text-center">
                                    <Users className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                                    <p className="text-sm text-muted-foreground">Nenhum cliente encontrado</p>
                                    {params.busca && (
                                        <Button variant="link" size="sm" className="mt-1" asChild>
                                            <Link href="/clientes">Limpar busca</Link>
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Página {page} de {totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                        {page > 1 ? (
                            <Button variant="outline" size="sm" className="rounded-xl gap-1" asChild>
                                <Link href={`/clientes${buildQuery({ page: String(page - 1) })}`}>
                                    <ChevronLeft className="w-4 h-4" /> Anterior
                                </Link>
                            </Button>
                        ) : (
                            <Button variant="outline" size="sm" className="rounded-xl gap-1" disabled>
                                <ChevronLeft className="w-4 h-4" /> Anterior
                            </Button>
                        )}
                        {page < totalPages ? (
                            <Button variant="outline" size="sm" className="rounded-xl gap-1" asChild>
                                <Link href={`/clientes${buildQuery({ page: String(page + 1) })}`}>
                                    Próxima <ChevronRight className="w-4 h-4" />
                                </Link>
                            </Button>
                        ) : (
                            <Button variant="outline" size="sm" className="rounded-xl gap-1" disabled>
                                Próxima <ChevronRight className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
