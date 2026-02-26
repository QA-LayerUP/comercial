import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Eye } from "lucide-react";
import { getProfile } from "@/lib/actions/auth";

export default async function ClientesPage({
    searchParams,
}: {
    searchParams: Promise<{ busca?: string; ativo?: string; page?: string }>;
}) {
    const params = await searchParams;
    const supabase = await createClient();
    const profile = await getProfile();
    const { canCreateCliente } = await import("@/lib/permissions");
    const canCreate = canCreateCliente(profile);

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

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
                    <p className="text-muted-foreground">{count || 0} clientes</p>
                </div>
                {canCreate && (
                    <Button className="bg-[#E91E8C] hover:bg-[#D4177F] text-white" size="sm" asChild>
                        <Link href="/clientes/novo">
                            <Plus className="w-4 h-4 mr-2" /> Novo Cliente
                        </Link>
                    </Button>
                )}
            </div>

            <Card className="p-4">
                <form className="flex flex-wrap gap-3 items-end">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input name="busca" placeholder="Nome ou CNPJ/CPF..." defaultValue={params.busca} className="pl-8 w-64" />
                    </div>
                    <select name="ativo" defaultValue={params.ativo || ""} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
                        <option value="">Todos</option>
                        <option value="1">Contrato Ativo</option>
                        <option value="0">Contrato Inativo</option>
                    </select>
                    <Button type="submit" size="sm"><Search className="w-4 h-4 mr-1" /> Filtrar</Button>
                    <Button type="button" variant="ghost" size="sm" asChild><Link href="/clientes">Limpar</Link></Button>
                </form>
            </Card>

            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>CNPJ/CPF</TableHead>
                            <TableHead>Contato</TableHead>
                            <TableHead>Contrato</TableHead>
                            <TableHead className="w-12"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {clientes?.map((c) => (
                            <TableRow key={c.id} className="group">
                                <TableCell className="font-medium">{c.nome}</TableCell>
                                <TableCell className="text-sm font-mono text-muted-foreground">{c.cnpj_cpf || "-"}</TableCell>
                                <TableCell className="text-sm">{c.contato_nome || "-"}</TableCell>
                                <TableCell>
                                    <Badge variant={c.contrato_ativo ? "default" : "secondary"}>
                                        {c.contrato_ativo ? "Ativo" : "Inativo"}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon" asChild className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Link href={`/clientes/${c.id}`}><Eye className="w-4 h-4" /></Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {(!clientes || clientes.length === 0) && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum cliente encontrado</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    {page > 1 && <Button variant="outline" size="sm" asChild><Link href={`/clientes?page=${page - 1}${params.busca ? `&busca=${params.busca}` : ""}${params.ativo ? `&ativo=${params.ativo}` : ""}`}>Anterior</Link></Button>}
                    <span className="text-sm text-muted-foreground">Página {page} de {totalPages}</span>
                    {page < totalPages && <Button variant="outline" size="sm" asChild><Link href={`/clientes?page=${page + 1}${params.busca ? `&busca=${params.busca}` : ""}${params.ativo ? `&ativo=${params.ativo}` : ""}`}>Próxima</Link></Button>}
                </div>
            )}
        </div>
    );
}
