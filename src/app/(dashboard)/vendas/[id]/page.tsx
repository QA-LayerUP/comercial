import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, CalendarDays, Tag, DollarSign, Users2, FileText } from "lucide-react";
import { formatMoney, MESES, CORES_CATEGORIA } from "@/lib/utils";
import { getProfile } from "@/lib/actions/auth";
import { DeleteVendaButton } from "@/components/vendas/delete-venda-button";

export default async function VendaDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const supabase = await createClient();
    const profile = await getProfile();
    const isAdmin = profile?.role === "admin";

    const { data: venda } = await supabase
        .from("vendas")
        .select("*")
        .eq("id", parseInt(id))
        .single();

    if (!venda) notFound();

    // Buscar nomes dos sales people
    const spFields = [
        { key: "estrategia1_id", label: "Estratégia 1" },
        { key: "estrategia2_id", label: "Estratégia 2" },
        { key: "vendedor1_id", label: "Vendedor 1" },
        { key: "vendedor2_id", label: "Vendedor 2" },
        { key: "gestao_projetos_id", label: "Gestão de Projetos" },
        { key: "customer_success_id", label: "Customer Success" },
        { key: "sdr_id", label: "SDR" },
    ];

    const spIds = spFields
        .map((f) => venda[f.key as keyof typeof venda])
        .filter(Boolean) as number[];

    let spNames: Record<number, string> = {};
    if (spIds.length > 0) {
        const { data: sps } = await supabase
            .from("sales_people")
            .select("id, nome")
            .in("id", spIds);
        sps?.forEach((sp) => {
            spNames[sp.id] = sp.nome;
        });
    }

    const cor = CORES_CATEGORIA[venda.categoria];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                    <Button variant="ghost" size="icon" className="mt-1 shrink-0" asChild>
                        <Link href="/vendas">
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{venda.nome_cliente}</h1>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                                <CalendarDays className="w-3.5 h-3.5" />
                                {MESES[venda.mes - 1]} / {venda.ano}
                            </span>
                            <span
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                style={{
                                    backgroundColor: (cor?.border || "#999") + "18",
                                    color: cor?.border || "#666",
                                }}
                            >
                                {venda.categoria}
                            </span>
                            {venda.venda_codigo && (
                                <span className="text-xs font-mono text-muted-foreground bg-[#F5F6FA] px-2 py-0.5 rounded">
                                    #{venda.venda_codigo}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                {isAdmin && (
                    <div className="flex gap-2 shrink-0">
                        <Button variant="outline" size="sm" className="rounded-lg" asChild>
                            <Link href={`/vendas/${venda.id}/editar`}>
                                <Edit className="w-4 h-4 mr-2" />
                                Editar
                            </Link>
                        </Button>
                        <DeleteVendaButton vendaId={venda.id} />
                    </div>
                )}
            </div>

            {/* Valor destaque */}
            <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-0 bg-[#FFC857] overflow-hidden">
                <CardContent className="p-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                        <div>
                            <p className="text-xs text-[#1A1A1A]/50 uppercase tracking-wider mb-1">Valor</p>
                            <p className="text-2xl font-bold font-mono text-[#1A1A1A]">{formatMoney(Number(venda.valor))}</p>
                        </div>
                        <div>
                            <p className="text-xs text-[#1A1A1A]/50 uppercase tracking-wider mb-1">Comissão</p>
                            <p className="text-2xl font-bold font-mono text-[#1A1A1A]">{formatMoney(Number(venda.comissao_valor))}</p>
                        </div>
                        <div>
                            <p className="text-xs text-[#1A1A1A]/50 uppercase tracking-wider mb-1">% Comissão</p>
                            <p className="text-2xl font-bold font-mono text-[#1A1A1A]">{Number(venda.comissao_percentual).toFixed(1)}%</p>
                        </div>
                        <div>
                            <p className="text-xs text-[#1A1A1A]/50 uppercase tracking-wider mb-1">Base Cálculo</p>
                            <p className="text-2xl font-bold font-mono text-[#1A1A1A]">{formatMoney(Number(venda.valor_calculo_comissao))}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Classificação do Produto */}
                <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-0">
                    <CardContent className="p-0">
                        <div className="flex items-center gap-2 px-6 py-4 border-b border-[#F1F1F1]">
                            <Tag className="w-4 h-4 text-[#E91E8C]" />
                            <h3 className="font-semibold text-sm">Classificação do Produto</h3>
                        </div>
                        <div className="divide-y divide-[#F5F6FA]">
                            {[
                                { label: "Produto", value: venda.produto },
                                { label: "Categoria", value: venda.categoria },
                                { label: "Perfil", value: venda.perfil },
                                { label: "Tipo", value: venda.tipo },
                                { label: "Especificação", value: venda.especificacao },
                                { label: "Vigência", value: venda.vigencia || "—" },
                            ].map((f) => (
                                <div key={f.label} className="flex items-center justify-between px-6 py-3">
                                    <span className="text-sm text-muted-foreground">{f.label}</span>
                                    <span className="text-sm font-medium text-right">{f.value}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Detalhes Financeiros */}
                <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-0">
                    <CardContent className="p-0">
                        <div className="flex items-center gap-2 px-6 py-4 border-b border-[#F1F1F1]">
                            <DollarSign className="w-4 h-4 text-[#00C896]" />
                            <h3 className="font-semibold text-sm">Detalhes Financeiros</h3>
                        </div>
                        <div className="divide-y divide-[#F5F6FA]">
                            {[
                                { label: "Valor Total", value: formatMoney(Number(venda.valor)) },
                                { label: "Repasse/Desconto", value: venda.repasse_desconto || "—" },
                                { label: "Valor Repasse", value: formatMoney(Number(venda.valor_repasse)) },
                                { label: "Volume Horas", value: Number(venda.volume_horas).toFixed(1) },
                                { label: "Valor/Hora", value: formatMoney(Number(venda.valor_por_hora)) },
                                { label: "Volume Sales People", value: String(venda.volume_sales_people || "—") },
                            ].map((f) => (
                                <div key={f.label} className="flex items-center justify-between px-6 py-3">
                                    <span className="text-sm text-muted-foreground">{f.label}</span>
                                    <span className="text-sm font-medium font-mono text-right">{f.value}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Equipe Comercial */}
            <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-0">
                <CardContent className="p-0">
                    <div className="flex items-center gap-2 px-6 py-4 border-b border-[#F1F1F1]">
                        <Users2 className="w-4 h-4 text-[#3A86FF]" />
                        <h3 className="font-semibold text-sm">Equipe Comercial</h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px bg-[#F5F6FA]">
                        {spFields.map((f) => {
                            const spId = venda[f.key as keyof typeof venda] as number | null;
                            const name = spId ? spNames[spId] : null;
                            return (
                                <div key={f.key} className="bg-white px-5 py-4">
                                    <p className="text-xs text-muted-foreground mb-1">{f.label}</p>
                                    {name ? (
                                        <p className="text-sm font-medium">{name}</p>
                                    ) : (
                                        <p className="text-sm text-muted-foreground/40">—</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Observações */}
            {venda.observacoes && (
                <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-0">
                    <CardContent className="p-0">
                        <div className="flex items-center gap-2 px-6 py-4 border-b border-[#F1F1F1]">
                            <FileText className="w-4 h-4 text-[#FFC857]" />
                            <h3 className="font-semibold text-sm">Observações</h3>
                        </div>
                        <div className="px-6 py-4">
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                {venda.observacoes}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
