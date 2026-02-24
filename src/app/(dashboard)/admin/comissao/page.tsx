import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/actions/auth";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search } from "lucide-react";
import Link from "next/link";

export default async function ComissaoPage({
    searchParams,
}: {
    searchParams: Promise<{ busca?: string; page?: string }>;
}) {
    const profile = await getProfile();
    if (profile?.role !== "admin") redirect("/");

    const params = await searchParams;
    const supabase = await createClient();

    const page = parseInt(params.page || "1");
    const perPage = 50;

    let query = supabase.from("regra_comissao").select("*", { count: "exact" });
    if (params.busca) {
        query = query.or(`produto.ilike.%${params.busca}%,categoria.ilike.%${params.busca}%,perfil.ilike.%${params.busca}%,tipo.ilike.%${params.busca}%`);
    }
    query = query.order("produto").order("categoria").range((page - 1) * perPage, page * perPage - 1);

    const { data: regras, count } = await query;
    const totalPages = Math.ceil((count || 0) / perPage);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Regras de Comissão</h1>
                <p className="text-muted-foreground">{count || 0} regras cadastradas</p>
            </div>

            <Card className="p-4">
                <form className="flex gap-3 items-end">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input name="busca" placeholder="Buscar por produto, categoria, perfil..." defaultValue={params.busca} className="pl-8" />
                    </div>
                    <Button type="submit" size="sm"><Search className="w-4 h-4 mr-1" /> Filtrar</Button>
                    <Button type="button" variant="ghost" size="sm" asChild><Link href="/admin/comissao">Limpar</Link></Button>
                </form>
            </Card>

            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Produto</TableHead>
                            <TableHead>Categoria</TableHead>
                            <TableHead>Perfil</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Especificação</TableHead>
                            <TableHead>Vigência</TableHead>
                            <TableHead className="text-right">Comissão %</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {regras?.map((r) => (
                            <TableRow key={r.id}>
                                <TableCell className="font-medium">{r.produto}</TableCell>
                                <TableCell>{r.categoria}</TableCell>
                                <TableCell>{r.perfil}</TableCell>
                                <TableCell>{r.tipo}</TableCell>
                                <TableCell>{r.especificacao}</TableCell>
                                <TableCell>{r.vigencia}</TableCell>
                                <TableCell className="text-right">
                                    <Badge variant="outline">{Number(r.comissao_percentual).toFixed(2)}%</Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    {page > 1 && <Button variant="outline" size="sm" asChild><Link href={`/admin/comissao?page=${page - 1}${params.busca ? `&busca=${params.busca}` : ""}`}>Anterior</Link></Button>}
                    <span className="text-sm text-muted-foreground">Página {page} de {totalPages}</span>
                    {page < totalPages && <Button variant="outline" size="sm" asChild><Link href={`/admin/comissao?page=${page + 1}${params.busca ? `&busca=${params.busca}` : ""}`}>Próxima</Link></Button>}
                </div>
            )}
        </div>
    );
}
