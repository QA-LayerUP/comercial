"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Save, Loader2, CalendarDays, Tag, DollarSign, Users2, FileText } from "lucide-react";
import { MESES, calcComissao } from "@/lib/utils";
import { createVenda, updateVenda } from "@/lib/actions/vendas";
import { toast } from "sonner";
import Link from "next/link";
import type { Venda, SalesPerson, Cliente } from "@/lib/types/database";

import { ClientAutocomplete } from "@/components/clientes/client-autocomplete";

const selectClass =
    "w-full h-10 rounded-lg border-transparent bg-[#F5F6FA] px-3 text-sm transition-colors focus:bg-white focus:border-[#FFC857] focus:ring-2 focus:ring-[#FFC857]/20 outline-none";

const inputClass =
    "h-10 bg-[#F5F6FA] border-transparent focus:bg-white focus:border-[#FFC857]";

interface VendaFormProps {
    venda?: Venda | null;
    salesPeople: SalesPerson[];
    clientes: Cliente[];
}

export function VendaForm({ venda, salesPeople, clientes: initialClientes }: VendaFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const isEdit = !!venda;
    const anoAtual = new Date().getFullYear();

    const [localClientes, setLocalClientes] = useState<Cliente[]>(initialClientes);
    const [selectedClient, setSelectedClient] = useState<{ id: number; nome: string } | null>(
        venda ? { id: venda.cliente_id || 0, nome: venda.nome_cliente } : null
    );

    // Venda codigo auto-generation
    const [vendaCodigo, setVendaCodigo] = useState(venda?.venda_codigo || "");

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
    const [volumeSalesPeople, setVolumeSalesPeople] = useState(venda?.volume_sales_people || 1);

    const isFeeMenusal = tipo.trim().toLowerCase() === "fee mensal";
    const { baseCalculo, comissaoPorVendedor, comissaoSDR } = calcComissao(
        tipo,
        parseFloat(valor) || 0,
        parseFloat(valorRepasse) || 0,
        parseFloat(comissaoPct) || 0,
        volumeSalesPeople
    );

    const supabase = createClient();

    // Auto-generate venda_codigo for new vendas
    useEffect(() => {
        if (isEdit) return;
        supabase
            .from("vendas")
            .select("venda_codigo")
            .not("venda_codigo", "is", null)
            .neq("venda_codigo", "")
            .order("venda_codigo", { ascending: false })
            .limit(1)
            .single()
            .then(({ data }) => {
                if (data?.venda_codigo) {
                    // Extract numeric part from "venda 0624" format
                    const match = data.venda_codigo.match(/(\d+)/);
                    if (match) {
                        const num = parseInt(match[1], 10);
                        const next = String(num + 1).padStart(match[1].length, "0");
                        // Keep same prefix format
                        const prefix = data.venda_codigo.slice(0, data.venda_codigo.indexOf(match[1]));
                        setVendaCodigo(`${prefix}${next}`);
                    }
                }
            });
    }, [isEdit]);

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

        if (!selectedClient) {
            toast.error("Por favor, selecione um cliente.");
            return;
        }

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
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" type="button" asChild>
                        <Link href={isEdit ? `/vendas/${venda!.id}` : "/vendas"}>
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {isEdit ? "Editar Venda" : "Nova Venda"}
                        </h1>
                        {isEdit && (
                            <p className="text-sm text-muted-foreground">{venda?.nome_cliente}</p>
                        )}
                    </div>
                </div>
                <Button
                    type="submit"
                    disabled={loading}
                    className="bg-[#E91E8C] hover:bg-[#D4177F] text-white px-6"
                >
                    {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <>
                            <Save className="w-4 h-4 mr-2" />
                            Salvar
                        </>
                    )}
                </Button>
            </div>

            {/* Período e Cliente */}
            <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-0">
                <CardContent className="p-0">
                    <div className="flex items-center gap-2 px-6 py-4 border-b border-[#F1F1F1]">
                        <CalendarDays className="w-4 h-4 text-[#E91E8C]" />
                        <h3 className="font-semibold text-sm">Período e Cliente</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Ano</Label>
                            <Input name="ano" type="number" defaultValue={venda?.ano || anoAtual} required className={inputClass} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Mês</Label>
                            <select name="mes" defaultValue={venda?.mes || 1} className={selectClass} required>
                                {MESES.map((m, i) => (
                                    <option key={i} value={i + 1}>{m}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5 lg:col-span-2">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Cliente</Label>
                            <input type="hidden" name="nome_cliente" value={selectedClient?.nome || ""} />
                            <input type="hidden" name="cliente_id" value={selectedClient?.id || ""} />
                            <ClientAutocomplete
                                clientes={localClientes}
                                defaultValue={selectedClient || undefined}
                                onSelect={(client) => {
                                    setSelectedClient(client);
                                    if (client && !localClientes.find(c => c.id === client.id)) {
                                        setLocalClientes(prev => [...prev, client as any]);
                                    }
                                }}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Classificação - Cascading Dropdowns */}
            <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-0">
                <CardContent className="p-0">
                    <div className="flex items-center gap-2 px-6 py-4 border-b border-[#F1F1F1]">
                        <Tag className="w-4 h-4 text-[#FFC857]" />
                        <h3 className="font-semibold text-sm">Classificação do Produto</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Código Venda</Label>
                            <Input name="venda_codigo" value={vendaCodigo} onChange={(e) => setVendaCodigo(e.target.value)} className={inputClass} placeholder="Ex: 0608" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Produto</Label>
                            <select name="produto" value={produto} onChange={(e) => { setProduto(e.target.value); setCategoria(""); setPerfil(""); setTipo(""); setEspecificacao(""); setVigencia(""); }} className={selectClass} required>
                                <option value="">Selecione...</option>
                                {produtos.map((p) => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Categoria</Label>
                            <select name="categoria" value={categoria} onChange={(e) => { setCategoria(e.target.value); setPerfil(""); setTipo(""); setEspecificacao(""); setVigencia(""); }} className={selectClass} required>
                                <option value="">Selecione...</option>
                                {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Perfil</Label>
                            <select name="perfil" value={perfil} onChange={(e) => { setPerfil(e.target.value); setTipo(""); setEspecificacao(""); setVigencia(""); }} className={selectClass} required>
                                <option value="">Selecione...</option>
                                {perfis.map((p) => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tipo</Label>
                            <select name="tipo" value={tipo} onChange={(e) => { setTipo(e.target.value); setEspecificacao(""); setVigencia(""); }} className={selectClass} required>
                                <option value="">Selecione...</option>
                                {tipos.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Especificação</Label>
                            <select name="especificacao" value={especificacao} onChange={(e) => { setEspecificacao(e.target.value); setVigencia(""); }} className={selectClass} required>
                                <option value="">Selecione...</option>
                                {especificacoes.map((e) => <option key={e} value={e}>{e}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Vigência</Label>
                            <select name="vigencia" value={vigencia} onChange={(e) => setVigencia(e.target.value)} className={selectClass}>
                                <option value="">Selecione...</option>
                                {vigencias.map((v) => <option key={v} value={v}>{v}</option>)}
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Financeiro */}
            <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-0">
                <CardContent className="p-0">
                    <div className="flex items-center gap-2 px-6 py-4 border-b border-[#F1F1F1]">
                        <DollarSign className="w-4 h-4 text-[#00C896]" />
                        <h3 className="font-semibold text-sm">Financeiro</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Valor (R$)</Label>
                            <Input name="valor" type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} className={inputClass} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Repasse/Desconto</Label>
                            <Input name="repasse_desconto" defaultValue={venda?.repasse_desconto || ""} className={inputClass} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Valor Repasse (R$)</Label>
                            <Input name="valor_repasse" type="number" step="0.01" value={valorRepasse} onChange={(e) => setValorRepasse(e.target.value)} className={inputClass} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Base Cálculo{isFeeMenusal ? <span className="ml-1 text-[#E91E8C]">(÷12)</span> : ""}
                            </Label>
                            <Input value={baseCalculo.toFixed(2)} readOnly className="h-10 bg-[#F0F0F0] border-transparent font-mono cursor-not-allowed" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Volume Horas</Label>
                            <Input name="volume_horas" type="number" step="0.1" defaultValue={venda?.volume_horas || 0} className={inputClass} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Valor/Hora</Label>
                            <Input name="valor_por_hora" type="number" step="0.01" defaultValue={venda?.valor_por_hora || 0} className={inputClass} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Comissão %</Label>
                            <Input name="comissao_percentual" type="number" step="0.01" value={comissaoPct} onChange={(e) => setComissaoPct(e.target.value)} className={inputClass} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Comissão / Vendedor</Label>
                            <Input value={`R$ ${comissaoPorVendedor.toFixed(2)}`} readOnly className="h-10 bg-[#F0F0F0] border-transparent font-mono cursor-not-allowed text-[#00C896]" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Comissão SDR (5%)</Label>
                            <Input value={`R$ ${comissaoSDR.toFixed(2)}`} readOnly className="h-10 bg-[#F0F0F0] border-transparent font-mono cursor-not-allowed text-[#3A86FF]" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Equipe Comercial */}
            <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-0">
                <CardContent className="p-0">
                    <div className="flex items-center gap-2 px-6 py-4 border-b border-[#F1F1F1]">
                        <Users2 className="w-4 h-4 text-[#3A86FF]" />
                        <h3 className="font-semibold text-sm">Equipe Comercial</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Vol. Sales People</Label>
                            <Input
                                name="volume_sales_people"
                                type="number"
                                min={1}
                                value={volumeSalesPeople}
                                onChange={(e) => setVolumeSalesPeople(parseInt(e.target.value) || 1)}
                                className={inputClass}
                            />
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
                            <div key={field.name} className="space-y-1.5">
                                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{field.label}</Label>
                                <select name={field.name} defaultValue={venda?.[field.name as keyof Venda]?.toString() || ""} className={selectClass}>
                                    <option value="">-- Nenhum --</option>
                                    {spByCargo(field.cargo).map((sp) => (
                                        <option key={sp.id} value={sp.id}>{sp.nome}</option>
                                    ))}
                                </select>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Observações */}
            <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-0">
                <CardContent className="p-0">
                    <div className="flex items-center gap-2 px-6 py-4 border-b border-[#F1F1F1]">
                        <FileText className="w-4 h-4 text-[#FFC857]" />
                        <h3 className="font-semibold text-sm">Observações</h3>
                    </div>
                    <div className="p-6">
                        <textarea
                            name="observacoes"
                            defaultValue={venda?.observacoes || ""}
                            rows={4}
                            placeholder="Notas adicionais sobre esta venda..."
                            className="w-full rounded-lg border-transparent bg-[#F5F6FA] px-4 py-3 text-sm transition-colors focus:bg-white focus:border-[#FFC857] focus:ring-2 focus:ring-[#FFC857]/20 outline-none resize-none"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Bottom Save */}
            <div className="flex items-center justify-between pt-2 pb-8">
                <Button type="button" variant="ghost" className="text-muted-foreground" asChild>
                    <Link href={isEdit ? `/vendas/${venda!.id}` : "/vendas"}>Cancelar</Link>
                </Button>
                <Button
                    type="submit"
                    disabled={loading}
                    className="bg-[#E91E8C] hover:bg-[#D4177F] text-white px-8"
                >
                    {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <>
                            <Save className="w-4 h-4 mr-2" />
                            Salvar Venda
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}
