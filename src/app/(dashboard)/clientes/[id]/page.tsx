import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Edit, ExternalLink } from "lucide-react";
import { formatMoney, MESES, CORES_CATEGORIA } from "@/lib/utils";
import { getProfile } from "@/lib/actions/auth";
import { DeleteClienteButton } from "@/components/clientes/delete-cliente-button";

export default async function ClienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();
    const profile = await getProfile();
    const isAdmin = profile?.role === "admin";

    const { data: cliente } = await supabase.from("clientes").select("*").eq("id", parseInt(id)).single();
    if (!cliente) notFound();

    const { data: vendas } = await supabase.from("vendas").select("*").eq("cliente_id", parseInt(id)).order("ano", { ascending: false }).order("mes", { ascending: false });

    return (
        <div className="space-y-6 max-w-4xl">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild><Link href="/clientes"><ArrowLeft className="w-4 h-4" /></Link></Button>
                    <div>
                        <h1 className="text-2xl font-bold">{cliente.nome}</h1>
                        <Badge variant={cliente.contrato_ativo ? "default" : "secondary"}>
                            {cliente.contrato_ativo ? "Contrato Ativo" : "Contrato Inativo"}
                        </Badge>
                    </div>
                </div>
                {isAdmin && (
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild><Link href={`/clientes/${cliente.id}/editar`}><Edit className="w-4 h-4 mr-2" />Editar</Link></Button>
                        <DeleteClienteButton clienteId={cliente.id} />
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-sm">Informações</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        {[
                            { label: "Confidencialidade", value: cliente.confidencialidade || "-" },
                            { label: "CNPJ/CPF", value: cliente.cnpj_cpf || "-" },
                            { label: "Data 1º Contrato", value: cliente.data_primeiro_contrato || "-" },
                            { label: "Data Renovação", value: cliente.data_renovacao || "-" },
                        ].map((f) => (
                            <div key={f.label} className="flex justify-between">
                                <span className="text-sm text-muted-foreground">{f.label}</span>
                                <span className="text-sm font-medium">{f.value}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-sm">Contato</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        {[
                            { label: "Nome", value: cliente.contato_nome || "-" },
                            { label: "Email", value: cliente.contato_email || "-" },
                            { label: "Telefone", value: cliente.contato_telefone || "-" },
                        ].map((f) => (
                            <div key={f.label} className="flex justify-between">
                                <span className="text-sm text-muted-foreground">{f.label}</span>
                                <span className="text-sm font-medium">{f.value}</span>
                            </div>
                        ))}
                        {cliente.link_contrato && (
                            <a href={cliente.link_contrato} target="_blank" rel="noreferrer" className="text-sm text-blue-600 flex items-center gap-1">
                                <ExternalLink className="w-3 h-3" /> Link do Contrato
                            </a>
                        )}
                    </CardContent>
                </Card>
            </div>

            {cliente.observacoes && (
                <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-sm">Observações</CardTitle></CardHeader>
                    <CardContent><p className="text-sm text-muted-foreground whitespace-pre-wrap">{cliente.observacoes}</p></CardContent>
                </Card>
            )}

            {/* Vendas vinculadas */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Vendas ({vendas?.length || 0})</CardTitle>
                </CardHeader>
                {vendas && vendas.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Período</TableHead>
                                <TableHead>Categoria</TableHead>
                                <TableHead>Produto</TableHead>
                                <TableHead className="text-right">Valor</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {vendas.map((v) => (
                                <TableRow key={v.id}>
                                    <TableCell><Link href={`/vendas/${v.id}`} className="font-mono text-sm text-blue-600 hover:underline">{v.ano}/{String(v.mes).padStart(2, "0")}</Link></TableCell>
                                    <TableCell><Badge className={`${CORES_CATEGORIA[v.categoria]?.tw || "bg-gray-500"} text-white text-xs`}>{v.categoria}</Badge></TableCell>
                                    <TableCell className="text-sm">{v.produto}</TableCell>
                                    <TableCell className="text-right font-mono">{formatMoney(Number(v.valor))}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <CardContent><p className="text-sm text-muted-foreground">Nenhuma venda vinculada</p></CardContent>
                )}
            </Card>
        </div>
    );
}
