import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Eye, Users2, Filter, X, Building2 } from "lucide-react";
import { getProfile } from "@/lib/actions/auth";

const selectClass =
    "h-10 rounded-lg border-transparent bg-[#F5F6FA] px-3 text-sm transition-colors focus:bg-white focus:border-[#FFC857] focus:ring-2 focus:ring-[#FFC857]/20 outline-none";

export default async function ClientesPage({
    searchParams,
}: {
    searchParams: Promise<{ busca?: string; ativo?: string; page?: string }>;
}) {
    const params = await searchParams;
    const supabase = await createClient();
    const profile = await getProfile();
    const isAdmin = profile?.role === "admin";

    const page = parseInt(params.page || "1");
    const perPage = 25;

    let query = supabase.from("clientes").select("*", { count: "exact" });

    if (params.busca) {
        query = query.or(`nome.ilike.%${params.busca}%,cnpj_cpf.ilike.%${params.busca}%`);
    }
    if (params.ativo === "1") query = query.eq("contrato_ativo", true);
    else if (params.ativo === "0") query = query.eq("contrato_ativo", false);

    query = query.order("nome").range((page - 1) * perPage, page * perPage - 1);

    const { data: clientes, count } = await query;
    const totalPages = Math.ceil((count || 0) / perPage);
    const ativos = clientes?.filter((c) => c.contrato_ativo).length || 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
                    <p className="text-sm text-muted-foreground">{count || 0} clientes cadastrados</p>
                </div>
                {isAdmin && (
                    <Button className="bg-[#E91E8C] hover:bg-[#D4177F] text-white" size="sm" asChild>
                        <Link href="/clientes/novo">
                            <Plus className="w-4 h-4 mr-2" /> Novo Cliente
                        </Link>
                    </Button>
                )}
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-0 bg-[#FFC857] overflow-hidden relative">
                    <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/15 rounded-full" />
                    <CardContent className="p-5 relative">
                        <p className="text-xs text-[#1A1A1A]/50 uppercase tracking-wider font-medium">Total Clientes</p>
                        <p className="text-3xl font-bold text-[#1A1A1A] mt-1">{count || 0}</p>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-0">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Contratos Ativos</p>
                                <p className="text-3xl font-bold mt-1 text-[#00C896]">{ativos}</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-[#00C896]/10 flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-[#00C896]" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-0">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Inativos</p>
                                <p className="text-3xl font-bold mt-1">{(clientes?.length || 0) - ativos}</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-[#F5F6FA] flex items-center justify-center">
                                <Users2 className="w-5 h-5 text-muted-foreground" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-0">
                <CardContent className="p-0">
                    <div className="flex items-center gap-2 px-6 py-4 border-b border-[#F1F1F1]">
                        <Filter className="w-4 h-4 text-[#E91E8C]" />
                        <h3 className="font-semibold text-sm">Filtros</h3>
                    </div>
                    <form className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-4 items-end p-6">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Buscar</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <input
                                    name="busca"
                                    placeholder="Nome ou CNPJ/CPF..."
                                    defaultValue={params.busca}
                                    className={`${selectClass} w-full pl-9`}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</label>
                            <select name="ativo" defaultValue={params.ativo || ""} className={selectClass}>
                                <option value="">Todos</option>
                                <option value="1">Contrato Ativo</option>
                                <option value="0">Contrato Inativo</option>
                            </select>
                        </div>
                        <Button type="submit" size="sm" className="bg-[#E91E8C] hover:bg-[#D4177F] text-white h-10 px-5">
                            <Search className="w-4 h-4 mr-1.5" /> Filtrar
                        </Button>
                        {(params.busca || params.ativo) && (
                            <Button type="button" variant="ghost" size="sm" className="h-10 text-muted-foreground" asChild>
                                <Link href="/clientes"><X className="w-3.5 h-3.5 mr-1" /> Limpar</Link>
                            </Button>
                        )}
                    </form>
                </CardContent>
            </Card>

            {/* Table */}
            <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] overflow-hidden border-0">
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#F1F1F1]">
                    <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-[#3A86FF]" />
                        <h3 className="font-semibold text-sm">Lista de Clientes</h3>
                    </div>
                    <span className="text-xs text-muted-foreground">
                        {clientes?.length || 0} nesta página
                    </span>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow className="bg-[#F5F6FA] hover:bg-[#F5F6FA]">
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#616161]">Nome</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#616161]">CNPJ/CPF</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#616161]">Contato</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#616161]">Contrato</TableHead>
                            <TableHead className="w-12"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {clientes?.map((c) => (
                            <TableRow key={c.id} className="group hover:bg-[#F9F9FB] transition-colors">
                                <TableCell>
                                    <Link href={`/clientes/${c.id}`} className="font-medium text-sm hover:text-[#E91E8C] transition-colors">
                                        {c.nome}
                                    </Link>
                                </TableCell>
                                <TableCell className="text-sm font-mono text-muted-foreground">{c.cnpj_cpf || "-"}</TableCell>
                                <TableCell className="text-sm">{c.contato_nome || "-"}</TableCell>
                                <TableCell>
                                    {c.contrato_ativo ? (
                                        <span className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#00C896]/12 text-[#00C896]">Ativo</span>
                                    ) : (
                                        <span className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#F5F6FA] text-muted-foreground">Inativo</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" asChild>
                                        <Link href={`/clientes/${c.id}`}><Eye className="w-4 h-4 text-muted-foreground" /></Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {(!clientes || clientes.length === 0) && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-12">
                                    <Building2 className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                                    <p className="text-muted-foreground">Nenhum cliente encontrado</p>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    {page > 1 && (
                        <Button variant="outline" size="sm" className="rounded-lg" asChild>
                            <Link href={`/clientes?page=${page - 1}${params.busca ? `&busca=${params.busca}` : ""}${params.ativo ? `&ativo=${params.ativo}` : ""}`}>Anterior</Link>
                        </Button>
                    )}
                    <span className="text-sm text-muted-foreground px-3">Página {page} de {totalPages}</span>
                    {page < totalPages && (
                        <Button variant="outline" size="sm" className="rounded-lg" asChild>
                            <Link href={`/clientes?page=${page + 1}${params.busca ? `&busca=${params.busca}` : ""}${params.ativo ? `&ativo=${params.ativo}` : ""}`}>Próxima</Link>
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
