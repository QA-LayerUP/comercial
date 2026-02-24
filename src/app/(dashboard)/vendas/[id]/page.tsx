import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
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

    const infoFields = [
        { label: "Código", value: venda.venda_codigo || "-" },
        { label: "Produto", value: venda.produto },
        { label: "Categoria", value: venda.categoria, badge: true },
        { label: "Perfil", value: venda.perfil },
        { label: "Tipo", value: venda.tipo },
        { label: "Especificação", value: venda.especificacao },
        { label: "Vigência", value: venda.vigencia || "-" },
    ];

    const finFields = [
        { label: "Valor", value: formatMoney(Number(venda.valor)) },
        { label: "Repasse/Desconto", value: venda.repasse_desconto || "-" },
        { label: "Valor Repasse", value: formatMoney(Number(venda.valor_repasse)) },
        { label: "Valor Base Comissão", value: formatMoney(Number(venda.valor_calculo_comissao)) },
        { label: "Comissão %", value: `${Number(venda.comissao_percentual).toFixed(2)}%` },
        { label: "Comissão Valor", value: formatMoney(Number(venda.comissao_valor)) },
        { label: "Volume Horas", value: Number(venda.volume_horas).toFixed(1) },
        { label: "Valor/Hora", value: formatMoney(Number(venda.valor_por_hora)) },
    ];

    return (
        <div className="space-y-6 max-w-4xl">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/vendas">
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">{venda.nome_cliente}</h1>
                        <p className="text-muted-foreground">
                            {MESES[venda.mes - 1]} / {venda.ano}
                        </p>
                    </div>
                </div>
                {isAdmin && (
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`/vendas/${venda.id}/editar`}>
                                <Edit className="w-4 h-4 mr-2" />
                                Editar
                            </Link>
                        </Button>
                        <DeleteVendaButton vendaId={venda.id} />
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Classificação */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Classificação</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {infoFields.map((f) => (
                            <div key={f.label} className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">{f.label}</span>
                                {f.badge ? (
                                    <Badge className={`${cor?.tw || "bg-gray-500"} text-white`}>
                                        {f.value}
                                    </Badge>
                                ) : (
                                    <span className="text-sm font-medium">{f.value}</span>
                                )}
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Financeiro */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Financeiro</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {finFields.map((f) => (
                            <div key={f.label} className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">{f.label}</span>
                                <span className="text-sm font-medium font-mono">{f.value}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Equipe */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Equipe Comercial</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {spFields.map((f) => {
                            const spId = venda[f.key as keyof typeof venda] as number | null;
                            return (
                                <div key={f.key} className="space-y-1">
                                    <p className="text-xs text-muted-foreground">{f.label}</p>
                                    <p className="text-sm font-medium">{spId ? spNames[spId] || "-" : "-"}</p>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Observações */}
            {venda.observacoes && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Observações</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {venda.observacoes}
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
