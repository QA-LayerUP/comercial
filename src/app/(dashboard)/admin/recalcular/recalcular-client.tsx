"use client";

import { useState, useTransition } from "react";
import { recalcularComissoes, type RecalcResult } from "@/lib/actions/vendas";
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
import { Badge } from "@/components/ui/badge";
import { RefreshCw, CheckCircle2, AlertTriangle, Loader2, ShieldAlert } from "lucide-react";
import { formatMoneyDecimal } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
    preview: RecalcResult;
}

export function RecalcularClient({ preview: initialPreview }: Props) {
    const [preview, setPreview] = useState<RecalcResult>(initialPreview);
    const [done, setDone] = useState(false);
    const [isPending, startTransition] = useTransition();

    function handleRefreshPreview() {
        startTransition(async () => {
            const result = await recalcularComissoes(true);
            setPreview(result);
            setDone(false);
        });
    }

    const [debugMsg, setDebugMsg] = useState<string | null>(null);

    function handleApply() {
        startTransition(async () => {
            const result = await recalcularComissoes(false);
            if (result.debug) setDebugMsg(result.debug);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(`${result.alteradas} venda(s) recalculada(s) com sucesso!`);
                setPreview({ ...result, preview: [] });
                setDone(true);
            }
        });
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Recalcular Comissões</h1>
                    <p className="text-sm text-muted-foreground">
                        Aplica as novas regras de cálculo (Fee Mensal ÷12, valor por vendedor) em todas as vendas cadastradas.
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleRefreshPreview} disabled={isPending}>
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                    Atualizar Preview
                </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-0">
                    <CardContent className="p-5">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Total de Vendas</p>
                        <p className="text-2xl font-bold mt-1">{preview.total}</p>
                    </CardContent>
                </Card>
                <Card className={`rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-0 ${preview.alteradas > 0 ? "bg-amber-50" : "bg-emerald-50"}`}>
                    <CardContent className="p-5">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Vendas a Corrigir</p>
                        <p className={`text-2xl font-bold mt-1 ${preview.alteradas > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                            {preview.alteradas}
                        </p>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-0">
                    <CardContent className="p-5">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Já Corretas</p>
                        <p className="text-2xl font-bold mt-1 text-emerald-600">{preview.total - preview.alteradas}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Status done */}
            {done && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <p className="text-sm font-medium text-emerald-700">
                        Todas as comissões foram recalculadas com sucesso. Nenhuma venda pendente.
                    </p>
                </div>
            )}

            {/* Warning + Apply */}
            {preview.alteradas > 0 && !done && (
                <>
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="text-sm text-amber-700">
                            <p className="font-semibold mb-1">Atenção — operação irreversível</p>
                            <p>
                                As <strong>{preview.alteradas}</strong> vendas abaixo serão atualizadas com os novos valores de base de cálculo e
                                comissão por vendedor. Verifique o preview antes de confirmar.
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button
                            onClick={handleApply}
                            disabled={isPending}
                            className="bg-[#E91E8C] hover:bg-[#D4177F] text-white px-6"
                        >
                            {isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                                <ShieldAlert className="w-4 h-4 mr-2" />
                            )}
                            Aplicar Recálculo ({preview.alteradas} vendas)
                        </Button>
                    </div>

                    {/* Preview Table */}
                    <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] overflow-hidden border-0">
                        <div className="px-6 py-4 border-b">
                            <h3 className="font-semibold text-sm">Preview das Alterações</h3>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-[#F5F6FA] hover:bg-[#F5F6FA]">
                                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#616161]">ID</TableHead>
                                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#616161]">Cliente</TableHead>
                                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#616161]">Tipo</TableHead>
                                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#616161] text-right">Base Anterior</TableHead>
                                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#616161] text-right">Base Nova</TableHead>
                                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#616161] text-right">Comissão Anterior</TableHead>
                                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#616161] text-right">Comissão Nova</TableHead>
                                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#616161] text-right">Diferença</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {preview.preview.map((item) => (
                                    <TableRow key={item.id} className="hover:bg-[#F9F9FB]">
                                        <TableCell className="font-mono text-xs text-muted-foreground">#{item.id}</TableCell>
                                        <TableCell className="font-medium text-sm max-w-[180px] truncate">{item.nome_cliente}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-xs">
                                                {item.tipo || "—"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-sm text-muted-foreground">
                                            {formatMoneyDecimal(item.baseCalculoAnterior)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-sm font-medium">
                                            {formatMoneyDecimal(item.baseCalculoNova)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-sm text-muted-foreground">
                                            {formatMoneyDecimal(item.comissaoAnterior)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-sm font-medium text-[#00C896]">
                                            {formatMoneyDecimal(item.comissaoNova)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-sm">
                                            <span className={item.diff >= 0 ? "text-emerald-600" : "text-red-500"}>
                                                {item.diff >= 0 ? "+" : ""}
                                                {formatMoneyDecimal(item.diff)}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                </>
            )}

            {/* Debug info */}
            {debugMsg && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200 font-mono text-xs text-blue-800 break-all">
                    <span className="font-bold shrink-0">DEBUG:</span> {debugMsg}
                </div>
            )}

            {preview.alteradas === 0 && !done && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <p className="text-sm font-medium text-emerald-700">
                        Todas as comissões já estão calculadas corretamente. Nenhuma atualização necessária.
                    </p>
                </div>
            )}
        </div>
    );
}
