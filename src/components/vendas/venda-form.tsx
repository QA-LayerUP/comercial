"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { MESES } from "@/lib/utils";
import { createVenda, updateVenda } from "@/lib/actions/vendas";
import { toast } from "sonner";
import Link from "next/link";
import type { Venda, SalesPerson, Cliente } from "@/lib/types/database";

interface VendaFormProps {
    venda?: Venda | null;
    salesPeople: SalesPerson[];
    clientes: Cliente[];
}

export function VendaForm({ venda, salesPeople, clientes }: VendaFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const isEdit = !!venda;
    const anoAtual = new Date().getFullYear();

    // Cascading dropdowns state
    const [produto, setProduto] = useState(venda?.produto || "");
    const [categoria, setCategoria] = useState(venda?.categoria || "");
    const [perfil, setPerfil] = useState(venda?.perfil || "");
    const [tipo, setTipo] = useState(venda?.tipo || "");
    const [especificacao, setEspecificacao] = useState(venda?.especificacao || "");
    const [vigencia, setVigencia] = useState(venda?.vigencia || "");

    const [produtos, setProdutos] = useState<string[]>([]);
    const [categorias, setCategorias] = useState<string[]>([]);
    const [perfis, setPerfis] = useState<string[]>([]);
    const [tipos, setTipos] = useState<string[]>([]);
    const [especificacoes, setEspecificacoes] = useState<string[]>([]);
    const [vigencias, setVigencias] = useState<string[]>([]);

    // Financial calculations
    const [valor, setValor] = useState(venda?.valor?.toString() || "0");
    const [valorRepasse, setValorRepasse] = useState(venda?.valor_repasse?.toString() || "0");
    const [comissaoPct, setComissaoPct] = useState(venda?.comissao_percentual?.toString() || "0");

    const valorCalculo = (parseFloat(valor) || 0) - (parseFloat(valorRepasse) || 0);
    const comissaoValor = valorCalculo * ((parseFloat(comissaoPct) || 0) / 100);

    const supabase = createClient();

    // Load dropdown options
    useEffect(() => {
        supabase
            .from("dropdown_options")
            .select("produto")
            .then(({ data }) => {
                const unique = [...new Set(data?.map((d) => d.produto).filter(Boolean))] as string[];
                setProdutos(unique.sort());
            });
    }, []);

    useEffect(() => {
        if (!produto) { setCategorias([]); return; }
        supabase
            .from("dropdown_options")
            .select("categoria")
            .eq("produto", produto)
            .not("categoria", "is", null)
            .then(({ data }) => {
                const unique = [...new Set(data?.map((d) => d.categoria).filter(Boolean))] as string[];
                setCategorias(unique.sort());
            });
    }, [produto]);

    useEffect(() => {
        if (!produto || !categoria) { setPerfis([]); return; }
        supabase
            .from("dropdown_options")
            .select("perfil")
            .eq("produto", produto)
            .eq("categoria", categoria)
            .not("perfil", "is", null)
            .then(({ data }) => {
                const unique = [...new Set(data?.map((d) => d.perfil).filter(Boolean))] as string[];
                setPerfis(unique.sort());
            });
    }, [produto, categoria]);

    useEffect(() => {
        if (!produto || !categoria || !perfil) { setTipos([]); return; }
        supabase
            .from("dropdown_options")
            .select("tipo")
            .eq("produto", produto)
            .eq("categoria", categoria)
            .eq("perfil", perfil)
            .not("tipo", "is", null)
            .then(({ data }) => {
                const unique = [...new Set(data?.map((d) => d.tipo).filter(Boolean))] as string[];
                setTipos(unique.sort());
            });
    }, [produto, categoria, perfil]);

    useEffect(() => {
        if (!produto || !categoria || !perfil || !tipo) { setEspecificacoes([]); return; }
        supabase
            .from("dropdown_options")
            .select("especificacao")
            .eq("produto", produto)
            .eq("categoria", categoria)
            .eq("perfil", perfil)
            .eq("tipo", tipo)
            .not("especificacao", "is", null)
            .then(({ data }) => {
                const unique = [...new Set(data?.map((d) => d.especificacao).filter(Boolean))] as string[];
                setEspecificacoes(unique.sort());
            });
    }, [produto, categoria, perfil, tipo]);

    useEffect(() => {
        if (!produto || !categoria || !perfil || !tipo || !especificacao) { setVigencias([]); return; }
        supabase
            .from("dropdown_options")
            .select("vigencia")
            .eq("produto", produto)
            .eq("categoria", categoria)
            .eq("perfil", perfil)
            .eq("tipo", tipo)
            .eq("especificacao", especificacao)
            .not("vigencia", "is", null)
            .then(({ data }) => {
                const unique = [...new Set(data?.map((d) => d.vigencia).filter(Boolean))] as string[];
                setVigencias(unique.sort());
            });
    }, [produto, categoria, perfil, tipo, especificacao]);

    // Auto-lookup comissão
    useEffect(() => {
        if (!produto || !categoria || !perfil || !tipo || !especificacao || !vigencia) return;
        supabase
            .from("regra_comissao")
            .select("comissao_percentual")
            .eq("produto", produto)
            .eq("categoria", categoria)
            .eq("perfil", perfil)
            .eq("tipo", tipo)
            .eq("especificacao", especificacao)
            .eq("vigencia", vigencia)
            .limit(1)
            .single()
            .then(({ data }) => {
                if (data) setComissaoPct(data.comissao_percentual.toString());
            });
    }, [produto, categoria, perfil, tipo, especificacao, vigencia]);

    // Filter sales people by cargo
    const spByCargo = (cargo: string) =>
        salesPeople.filter((sp) => sp.cargo === cargo);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);

        const result = isEdit
            ? await updateVenda(venda!.id, formData)
            : await createVenda(formData);

        setLoading(false);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success(isEdit ? "Venda atualizada!" : "Venda cadastrada!");
            router.push(isEdit ? `/vendas/${venda!.id}` : "/vendas");
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" type="button" asChild>
                    <Link href={isEdit ? `/vendas/${venda!.id}` : "/vendas"}>
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold">
                    {isEdit ? "Editar Venda" : "Nova Venda"}
                </h1>
            </div>

            {/* Período e Cliente */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Período e Cliente</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <Label htmlFor="ano">Ano</Label>
                        <Input name="ano" type="number" defaultValue={venda?.ano || anoAtual} required />
                    </div>
                    <div>
                        <Label htmlFor="mes">Mês</Label>
                        <select name="mes" defaultValue={venda?.mes || 1} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" required>
                            {MESES.map((m, i) => (
                                <option key={i} value={i + 1}>{m}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <Label htmlFor="nome_cliente">Cliente</Label>
                        <Input name="nome_cliente" defaultValue={venda?.nome_cliente || ""} required />
                    </div>
                    <div>
                        <Label htmlFor="cliente_id">Vincular Cliente</Label>
                        <select name="cliente_id" defaultValue={venda?.cliente_id?.toString() || ""} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                            <option value="">-- Nenhum --</option>
                            {clientes.map((c) => (
                                <option key={c.id} value={c.id}>{c.nome}</option>
                            ))}
                        </select>
                    </div>
                </CardContent>
            </Card>

            {/* Classificação - Cascading Dropdowns */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Classificação</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <Label>Código Venda</Label>
                        <Input name="venda_codigo" defaultValue={venda?.venda_codigo || ""} />
                    </div>
                    <div>
                        <Label>Produto</Label>
                        <select name="produto" value={produto} onChange={(e) => { setProduto(e.target.value); setCategoria(""); setPerfil(""); setTipo(""); setEspecificacao(""); setVigencia(""); }} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" required>
                            <option value="">Selecione...</option>
                            {produtos.map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <div>
                        <Label>Categoria</Label>
                        <select name="categoria" value={categoria} onChange={(e) => { setCategoria(e.target.value); setPerfil(""); setTipo(""); setEspecificacao(""); setVigencia(""); }} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" required>
                            <option value="">Selecione...</option>
                            {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <Label>Perfil</Label>
                        <select name="perfil" value={perfil} onChange={(e) => { setPerfil(e.target.value); setTipo(""); setEspecificacao(""); setVigencia(""); }} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" required>
                            <option value="">Selecione...</option>
                            {perfis.map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <div>
                        <Label>Tipo</Label>
                        <select name="tipo" value={tipo} onChange={(e) => { setTipo(e.target.value); setEspecificacao(""); setVigencia(""); }} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" required>
                            <option value="">Selecione...</option>
                            {tipos.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <Label>Especificação</Label>
                        <select name="especificacao" value={especificacao} onChange={(e) => { setEspecificacao(e.target.value); setVigencia(""); }} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" required>
                            <option value="">Selecione...</option>
                            {especificacoes.map((e) => <option key={e} value={e}>{e}</option>)}
                        </select>
                    </div>
                    <div>
                        <Label>Vigência</Label>
                        <select name="vigencia" value={vigencia} onChange={(e) => setVigencia(e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                            <option value="">Selecione...</option>
                            {vigencias.map((v) => <option key={v} value={v}>{v}</option>)}
                        </select>
                    </div>
                </CardContent>
            </Card>

            {/* Financeiro */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Financeiro</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <Label>Valor (R$)</Label>
                        <Input name="valor" type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} />
                    </div>
                    <div>
                        <Label>Repasse/Desconto</Label>
                        <Input name="repasse_desconto" defaultValue={venda?.repasse_desconto || ""} />
                    </div>
                    <div>
                        <Label>Valor Repasse (R$)</Label>
                        <Input name="valor_repasse" type="number" step="0.01" value={valorRepasse} onChange={(e) => setValorRepasse(e.target.value)} />
                    </div>
                    <div>
                        <Label>Valor Base Comissão</Label>
                        <Input value={valorCalculo.toFixed(2)} readOnly className="bg-muted" />
                    </div>
                    <div>
                        <Label>Volume Horas</Label>
                        <Input name="volume_horas" type="number" step="0.1" defaultValue={venda?.volume_horas || 0} />
                    </div>
                    <div>
                        <Label>Valor/Hora</Label>
                        <Input name="valor_por_hora" type="number" step="0.01" defaultValue={venda?.valor_por_hora || 0} />
                    </div>
                    <div>
                        <Label>Comissão %</Label>
                        <Input name="comissao_percentual" type="number" step="0.01" value={comissaoPct} onChange={(e) => setComissaoPct(e.target.value)} />
                    </div>
                    <div>
                        <Label>Comissão Valor</Label>
                        <Input value={`R$ ${comissaoValor.toFixed(2)}`} readOnly className="bg-muted" />
                    </div>
                </CardContent>
            </Card>

            {/* Equipe */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Equipe Comercial</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <Label>Vol. Sales People</Label>
                        <Input name="volume_sales_people" type="number" defaultValue={venda?.volume_sales_people || 1} />
                    </div>
                    {[
                        { name: "estrategia1_id", label: "Estratégia 1", cargo: "Estrategia" },
                        { name: "estrategia2_id", label: "Estratégia 2", cargo: "Estrategia" },
                        { name: "vendedor1_id", label: "Vendedor 1", cargo: "Vendedor" },
                        { name: "vendedor2_id", label: "Vendedor 2", cargo: "Vendedor" },
                        { name: "gestao_projetos_id", label: "Gestão Projetos", cargo: "Gestao de projetos" },
                        { name: "customer_success_id", label: "Customer Success", cargo: "Customer Success" },
                        { name: "sdr_id", label: "SDR", cargo: "SDR" },
                    ].map((field) => (
                        <div key={field.name}>
                            <Label>{field.label}</Label>
                            <select name={field.name} defaultValue={venda?.[field.name as keyof Venda]?.toString() || ""} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                                <option value="">-- Nenhum --</option>
                                {spByCargo(field.cargo).map((sp) => (
                                    <option key={sp.id} value={sp.id}>{sp.nome}</option>
                                ))}
                            </select>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Observações */}
            <Card>
                <CardContent className="pt-6">
                    <Label>Observações</Label>
                    <textarea
                        name="observacoes"
                        defaultValue={venda?.observacoes || ""}
                        rows={3}
                        className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button type="submit" disabled={loading} className="min-w-32">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Salvar</>}
                </Button>
            </div>
        </form>
    );
}
