import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Edit, ExternalLink, Building2, User, Calendar, FileText, ShoppingCart, Link2 } from "lucide-react";
import { formatMoney, MESES, CORES_CATEGORIA } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
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

    const totalVendas = vendas?.reduce((s, v) => s + (Number(v.valor) || 0), 0) || 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="rounded-xl" asChild>
                        <Link href="/clientes"><ArrowLeft className="w-4 h-4" /></Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold">{cliente.nome}</h1>
                            {cliente.contrato_ativo ? (
                                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#00C896]/12 text-[#00C896]">Ativo</span>
                            ) : (
                                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#F5F6FA] text-muted-foreground">Inativo</span>
                            )}
                        </div>
                        {cliente.cnpj_cpf && (
                            <p className="text-sm text-muted-foreground font-mono mt-0.5">{cliente.cnpj_cpf}</p>
                        )}
                    </div>
                </div>
                {isAdmin && (
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="rounded-lg" asChild>
                            <Link href={`/clientes/${cliente.id}/editar`}>
                                <Edit className="w-4 h-4 mr-2" />Editar
                            </Link>
                        </Button>
                        <DeleteClienteButton clienteId={cliente.id} />
                    </div>
                )}
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Informações */}
                <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-0 overflow-hidden">
                    <div className="flex items-center gap-2 px-6 py-4 border-b border-[#F1F1F1]">
                        <Building2 className="w-4 h-4 text-[#E91E8C]" />
                        <h3 className="font-semibold text-sm">Informações</h3>
                    </div>
                    <CardContent className="p-6 space-y-4">
                        {[
                            { label: "Confidencialidade", value: cliente.confidencialidade || "-" },
                            { label: "CNPJ/CPF", value: cliente.cnpj_cpf || "-", mono: true },
                            { label: "Data 1º Contrato", value: cliente.data_primeiro_contrato || "-" },
                            { label: "Data Renovação", value: cliente.data_renovacao || "-" },
                        ].map((f) => (
                            <div key={f.label} className="flex justify-between items-center">
                                <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{f.label}</span>
                                <span className={`text-sm font-medium ${f.mono ? "font-mono" : ""}`}>{f.value}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Contato */}
                <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-0 overflow-hidden">
                    <div className="flex items-center gap-2 px-6 py-4 border-b border-[#F1F1F1]">
                        <User className="w-4 h-4 text-[#3A86FF]" />
                        <h3 className="font-semibold text-sm">Contato</h3>
                    </div>
                    <CardContent className="p-6 space-y-4">
                        {[
                            { label: "Nome", value: cliente.contato_nome || "-" },
                            { label: "Email", value: cliente.contato_email || "-" },
                            { label: "Telefone", value: cliente.contato_telefone || "-" },
                        ].map((f) => (
                            <div key={f.label} className="flex justify-between items-center">
                                <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{f.label}</span>
                                <span className="text-sm font-medium">{f.value}</span>
                            </div>
                        ))}
                        {(cliente.link_contrato || cliente.link_proposta) && (
                            <div className="pt-3 border-t border-[#F1F1F1] space-y-2">
                                {cliente.link_contrato && (
                                    <a href={cliente.link_contrato} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-[#3A86FF] hover:text-[#2B6ED9] transition-colors">
                                        <Link2 className="w-3.5 h-3.5" /> Link do Contrato
                                        <ExternalLink className="w-3 h-3 ml-auto" />
                                    </a>
                                )}
                                {cliente.link_proposta && (
                                    <a href={cliente.link_proposta} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-[#3A86FF] hover:text-[#2B6ED9] transition-colors">
                                        <Link2 className="w-3.5 h-3.5" /> Link da Proposta
                                        <ExternalLink className="w-3 h-3 ml-auto" />
                                    </a>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Observações */}
            {cliente.observacoes && (
                <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-0 overflow-hidden">
                    <div className="flex items-center gap-2 px-6 py-4 border-b border-[#F1F1F1]">
                        <FileText className="w-4 h-4 text-[#FFC857]" />
                        <h3 className="font-semibold text-sm">Observações</h3>
                    </div>
                    <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{cliente.observacoes}</p>
                    </CardContent>
                </Card>
            )}

            {/* Vendas vinculadas */}
            <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] overflow-hidden border-0">
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#F1F1F1]">
                    <div className="flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4 text-[#00C896]" />
                        <h3 className="font-semibold text-sm">Vendas</h3>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">{vendas?.length || 0} vendas</span>
                        {totalVendas > 0 && (
                            <span className="text-xs font-semibold font-mono text-[#00C896] bg-[#00C896]/10 px-2 py-0.5 rounded-full">
                                {formatMoney(totalVendas)}
                            </span>
                        )}
                    </div>
                </div>
                {vendas && vendas.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-[#F5F6FA] hover:bg-[#F5F6FA]">
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#616161]">Período</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#616161]">Categoria</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#616161]">Produto</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#616161] text-right">Valor</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {vendas.map((v) => (
                                <TableRow key={v.id} className="hover:bg-[#F9F9FB] transition-colors">
                                    <TableCell>
                                        <Link href={`/vendas/${v.id}`} className="font-mono text-sm text-[#3A86FF] hover:text-[#2B6ED9] transition-colors">
                                            {v.ano}/{String(v.mes).padStart(2, "0")}
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={`${CORES_CATEGORIA[v.categoria]?.tw || "bg-gray-500"} text-white text-xs`}>
                                            {v.categoria}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm">{v.produto}</TableCell>
                                    <TableCell className="text-right font-mono font-semibold text-sm text-[#00C896]">
                                        {formatMoney(Number(v.valor))}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <CardContent className="py-12 text-center">
                        <ShoppingCart className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Nenhuma venda vinculada</p>
                    </CardContent>
                )}
            </Card>
        </div>
    );
}
