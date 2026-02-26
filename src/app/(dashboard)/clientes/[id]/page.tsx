import Link from "next/link";
import { notFound } from "next/navigation";
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
import {
    ArrowLeft,
    Edit,
    ExternalLink,
    Phone,
    Mail,
    User,
    Building2,
    FileText,
    CalendarDays,
    TrendingUp,
    ShoppingCart,
    DollarSign,
    Clock,
} from "lucide-react";
import { formatMoney, MESES, CORES_CATEGORIA } from "@/lib/utils";
import { getProfile } from "@/lib/actions/auth";
import { canEditCliente, canDeleteCliente } from "@/lib/permissions";
import { DeleteClienteButton } from "@/components/clientes/delete-cliente-button";

function initials(nome: string) {
    const parts = nome.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default async function ClienteDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const supabase = await createClient();
    const profile = await getProfile();
    const canEdit = canEditCliente(profile);
    const canDelete = canDeleteCliente(profile);

    const { data: cliente } = await supabase
        .from("clientes")
        .select("*")
        .eq("id", parseInt(id))
        .single();
    if (!cliente) notFound();

    const { data: vendas } = await supabase
        .from("vendas")
        .select("*")
        .eq("cliente_id", parseInt(id))
        .order("ano", { ascending: false })
        .order("mes", { ascending: false });

    // Revenue KPIs
    const totalFaturado = (vendas || []).reduce((s, v) => s + (Number(v.valor) || 0), 0);
    const qtdVendas = vendas?.length || 0;
    const ticketMedio = qtdVendas > 0 ? totalFaturado / qtdVendas : 0;
    const ultimaVenda = vendas?.[0];
    const ultimoPeriodo = ultimaVenda
        ? `${MESES[ultimaVenda.mes - 1]}/${ultimaVenda.ano}`
        : null;

    const fmtDate = (str: string | null) =>
        str ? new Date(str + "T00:00:00").toLocaleDateString("pt-BR") : null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="shrink-0 rounded-xl" asChild>
                        <Link href="/clientes">
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                    </Button>
                    <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className="w-14 h-14 rounded-2xl bg-[#E91E8C]/10 text-[#E91E8C] flex items-center justify-center text-lg font-bold shrink-0">
                            {initials(cliente.nome)}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold leading-tight">{cliente.nome}</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span
                                    className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                                        cliente.contrato_ativo
                                            ? "bg-[#00C896]/10 text-[#00C896]"
                                            : "bg-muted text-muted-foreground"
                                    }`}
                                >
                                    <span className={`w-1.5 h-1.5 rounded-full ${cliente.contrato_ativo ? "bg-[#00C896]" : "bg-muted-foreground/40"}`} />
                                    {cliente.contrato_ativo ? "Contrato Ativo" : "Contrato Inativo"}
                                </span>
                                {cliente.confidencialidade && (
                                    <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded-full">
                                        {cliente.confidencialidade}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                {(canEdit || canDelete) && (
                    <div className="flex gap-2 shrink-0">
                        {canEdit && (
                            <Button variant="outline" size="sm" className="rounded-xl" asChild>
                                <Link href={`/clientes/${cliente.id}/editar`}>
                                    <Edit className="w-3.5 h-3.5 mr-1.5" /> Editar
                                </Link>
                            </Button>
                        )}
                        {canDelete && <DeleteClienteButton clienteId={cliente.id} />}
                    </div>
                )}
            </div>

            {/* Revenue KPI cards */}
            {qtdVendas > 0 && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="rounded-2xl border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between mb-3">
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Faturado</p>
                                <span className="p-1.5 bg-[#E91E8C]/10 rounded-lg">
                                    <TrendingUp className="w-4 h-4 text-[#E91E8C]" />
                                </span>
                            </div>
                            <p className="text-2xl font-bold">{formatMoney(totalFaturado)}</p>
                            <p className="text-xs text-muted-foreground mt-1">acumulado</p>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between mb-3">
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Nº de Vendas</p>
                                <span className="p-1.5 bg-[#3A86FF]/10 rounded-lg">
                                    <ShoppingCart className="w-4 h-4 text-[#3A86FF]" />
                                </span>
                            </div>
                            <p className="text-2xl font-bold">{qtdVendas}</p>
                            <p className="text-xs text-muted-foreground mt-1">{qtdVendas === 1 ? "venda" : "vendas"} registradas</p>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between mb-3">
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Ticket Médio</p>
                                <span className="p-1.5 bg-[#8B5CF6]/10 rounded-lg">
                                    <DollarSign className="w-4 h-4 text-[#8B5CF6]" />
                                </span>
                            </div>
                            <p className="text-2xl font-bold">{formatMoney(ticketMedio)}</p>
                            <p className="text-xs text-muted-foreground mt-1">por venda</p>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between mb-3">
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Último Período</p>
                                <span className="p-1.5 bg-[#00C896]/10 rounded-lg">
                                    <Clock className="w-4 h-4 text-[#00C896]" />
                                </span>
                            </div>
                            <p className="text-2xl font-bold">{ultimoPeriodo ?? "—"}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {ultimaVenda ? formatMoney(Number(ultimaVenda.valor)) : "—"}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Info cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {/* Informações */}
                <Card className="rounded-2xl border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                    <div className="px-5 py-4 border-b flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        <h3 className="font-semibold text-sm">Informações</h3>
                    </div>
                    <CardContent className="p-5 space-y-4">
                        {[
                            {
                                icon: <FileText className="w-3.5 h-3.5" />,
                                label: "CNPJ/CPF",
                                value: cliente.cnpj_cpf,
                                mono: true,
                            },
                            {
                                icon: <CalendarDays className="w-3.5 h-3.5" />,
                                label: "1º Contrato",
                                value: fmtDate(cliente.data_primeiro_contrato),
                            },
                            {
                                icon: <CalendarDays className="w-3.5 h-3.5" />,
                                label: "Renovação",
                                value: fmtDate(cliente.data_renovacao),
                            },
                        ].map((f) =>
                            f.value ? (
                                <div key={f.label} className="flex items-center justify-between gap-4">
                                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                                        {f.icon}
                                        {f.label}
                                    </span>
                                    <span className={`text-sm font-medium ${f.mono ? "font-mono" : ""}`}>
                                        {f.value}
                                    </span>
                                </div>
                            ) : null
                        )}

                        {/* Links */}
                        <div className="flex flex-wrap gap-2 pt-1">
                            {cliente.link_contrato && (
                                <a
                                    href={cliente.link_contrato}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                                >
                                    <ExternalLink className="w-3 h-3" /> Contrato
                                </a>
                            )}
                            {cliente.link_proposta && (
                                <a
                                    href={cliente.link_proposta}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                                >
                                    <ExternalLink className="w-3 h-3" /> Proposta
                                </a>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Contato */}
                <Card className="rounded-2xl border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                    <div className="px-5 py-4 border-b flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <h3 className="font-semibold text-sm">Contato</h3>
                    </div>
                    <CardContent className="p-5 space-y-4">
                        {cliente.contato_nome && (
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-[#3A86FF]/10 text-[#3A86FF] flex items-center justify-center text-xs font-bold shrink-0">
                                    {initials(cliente.contato_nome)}
                                </div>
                                <p className="font-semibold text-sm">{cliente.contato_nome}</p>
                            </div>
                        )}

                        {cliente.contato_email && (
                            <a
                                href={`mailto:${cliente.contato_email}`}
                                className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                            >
                                <span className="p-1.5 bg-muted rounded-lg group-hover:bg-muted/80">
                                    <Mail className="w-3.5 h-3.5" />
                                </span>
                                {cliente.contato_email}
                            </a>
                        )}

                        {cliente.contato_telefone && (
                            <a
                                href={`tel:${cliente.contato_telefone}`}
                                className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                            >
                                <span className="p-1.5 bg-muted rounded-lg group-hover:bg-muted/80">
                                    <Phone className="w-3.5 h-3.5" />
                                </span>
                                {cliente.contato_telefone}
                            </a>
                        )}

                        {!cliente.contato_nome && !cliente.contato_email && !cliente.contato_telefone && (
                            <p className="text-sm text-muted-foreground">Sem contato cadastrado</p>
                        )}
                    </CardContent>
                </Card>

                {/* Observações — 3ª coluna quando existe */}
                {cliente.observacoes && (
                    <Card className="rounded-2xl border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)] md:col-span-2 xl:col-span-1">
                        <div className="px-5 py-4 border-b flex items-center gap-2">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <h3 className="font-semibold text-sm">Observações</h3>
                        </div>
                        <CardContent className="p-5">
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                {cliente.observacoes}
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Vendas */}
            <Card className="rounded-2xl border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)] overflow-hidden">
                <div className="px-5 py-4 border-b flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4 text-muted-foreground" />
                        <h3 className="font-semibold text-sm">Vendas</h3>
                        {qtdVendas > 0 && (
                            <span className="text-xs font-medium px-1.5 py-0.5 bg-muted rounded-full text-muted-foreground">
                                {qtdVendas}
                            </span>
                        )}
                    </div>
                    {qtdVendas > 0 && (
                        <p className="text-xs font-mono font-semibold text-muted-foreground">
                            Total: {formatMoney(totalFaturado)}
                        </p>
                    )}
                </div>

                {vendas && vendas.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30 hover:bg-muted/30">
                                <TableHead className="text-xs uppercase tracking-wide text-muted-foreground font-semibold w-24">Período</TableHead>
                                <TableHead className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Produto</TableHead>
                                <TableHead className="text-xs uppercase tracking-wide text-muted-foreground font-semibold hidden md:table-cell">Tipo</TableHead>
                                <TableHead className="text-xs uppercase tracking-wide text-muted-foreground font-semibold hidden sm:table-cell">Categoria</TableHead>
                                <TableHead className="text-xs uppercase tracking-wide text-muted-foreground font-semibold hidden lg:table-cell">Especificação</TableHead>
                                <TableHead className="text-right text-xs uppercase tracking-wide text-muted-foreground font-semibold">Valor</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {vendas.map((v) => (
                                <TableRow key={v.id} className="hover:bg-muted/30 transition-colors">
                                    <TableCell>
                                        <Link
                                            href={`/vendas/${v.id}`}
                                            className="font-mono text-sm font-medium text-[#3A86FF] hover:underline"
                                        >
                                            {MESES[v.mes - 1]}/{v.ano}
                                        </Link>
                                    </TableCell>
                                    <TableCell className="text-sm font-medium">{v.produto}</TableCell>
                                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{v.tipo || "—"}</TableCell>
                                    <TableCell className="hidden sm:table-cell">
                                        <span
                                            className={`text-xs font-medium px-2 py-0.5 rounded-full text-white ${
                                                CORES_CATEGORIA[v.categoria]?.tw || "bg-gray-500"
                                            }`}
                                        >
                                            {v.categoria}
                                        </span>
                                    </TableCell>
                                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground max-w-[200px] truncate">
                                        {v.especificacao || "—"}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-sm font-semibold">
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
