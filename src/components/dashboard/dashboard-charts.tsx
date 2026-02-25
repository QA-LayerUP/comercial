"use client";

import {
    Bar,
    BarChart,
    XAxis,
    YAxis,
    CartesianGrid,
    ResponsiveContainer,
    Legend,
    Tooltip,
    Cell,
    Pie,
    PieChart,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MESES, CORES_CATEGORIA } from "@/lib/utils";

interface ChartData {
    realizadoPorCategoria: Record<string, { total: number; qtd: number }>;
    metaFinalPorCategoria: Record<string, number>;
    mensalAtual: Record<number, number>;
    mensalAnterior: Record<number, number>;
    mensalPorCategoria: Record<number, Record<string, number>>;
    top10Clientes: { nome: string; valor: number }[];
    anoSelecionado: number;
    anoAnterior: number;
}

const formatMoney = (val: number) => {
    if (val >= 1000000) return `R$ ${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `R$ ${(val / 1000).toFixed(0)}K`;
    return `R$ ${val.toFixed(0)}`;
};

const formatMoneyFull = (val: number) =>
    new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(val);

const BRAND_PIE_COLORS = [
    "#E91E8C", "#FFC857", "#8A2BE2", "#00C896",
    "#3A86FF", "#FF6B6B", "#14B8A6", "#F59E0B",
];

const TOP10_COLORS = [
    "#E91E8C", "#E91E8C",
    "#FFC857", "#FFC857",
    "#00C896", "#00C896", "#00C896",
    "#B0BEC5", "#B0BEC5", "#B0BEC5",
];

const tooltipStyle = {
    borderRadius: "8px",
    border: "none",
    background: "#1A1A1A",
    color: "#F5F6FA",
    fontSize: "13px",
};

export function DashboardCharts({ data }: { data: ChartData }) {
    const categorias = [
        ...new Set([
            ...Object.keys(data.realizadoPorCategoria),
            ...Object.keys(data.metaFinalPorCategoria),
        ]),
    ];

    // Chart 1: Comparativo Mensal Ano x Ano
    const comparativoData = Array.from({ length: 12 }, (_, i) => ({
        mes: MESES[i],
        [data.anoAnterior]: data.mensalAnterior[i + 1] || 0,
        [data.anoSelecionado]: data.mensalAtual[i + 1] || 0,
    }));

    // Chart 2: Distribuição por Categoria (Pie chart) — filtrar zeros
    const distribuicaoData = categorias
        .map((cat, i) => ({
            name: cat,
            value: data.realizadoPorCategoria[cat]?.total || 0,
            fill: CORES_CATEGORIA[cat]?.border || BRAND_PIE_COLORS[i % BRAND_PIE_COLORS.length],
        }))
        .filter((d) => d.value > 0);

    // Chart 3: Top 10 Clientes
    const top10Data = data.top10Clientes.map((c) => ({
        nome: c.nome.length > 20 ? c.nome.slice(0, 18) + "…" : c.nome,
        nomeCompleto: c.nome,
        valor: c.valor,
    }));

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Comparativo Mensal YoY */}
                <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Comparativo Mensal — {data.anoSelecionado} vs {data.anoAnterior}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={320}>
                            <BarChart data={comparativoData}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis dataKey="mes" fontSize={11} />
                                <YAxis tickFormatter={formatMoney} fontSize={11} />
                                <Tooltip
                                    formatter={(val: number) => formatMoneyFull(val)}
                                    contentStyle={tooltipStyle}
                                    itemStyle={{ color: "#F5F6FA" }}
                                    labelStyle={{ color: "#F5F6FA" }}
                                />
                                <Legend />
                                <Bar
                                    dataKey={data.anoAnterior.toString()}
                                    fill="#94a3b8"
                                    radius={[4, 4, 0, 0]}
                                />
                                <Bar
                                    dataKey={data.anoSelecionado.toString()}
                                    fill="#E91E8C"
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Distribuição por Categoria */}
                <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Distribuição por Categoria
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={320}>
                            <PieChart>
                                <Pie
                                    data={distribuicaoData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={120}
                                    paddingAngle={3}
                                    dataKey="value"
                                    label={({ name, percent }) =>
                                        `${name} ${(percent * 100).toFixed(1)}%`
                                    }
                                    labelLine={true}
                                >
                                    {distribuicaoData.map((_, index) => (
                                        <Cell key={index} fill={BRAND_PIE_COLORS[index % BRAND_PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(val: number) => formatMoneyFull(val)}
                                    contentStyle={tooltipStyle}
                                    itemStyle={{ color: "#F5F6FA" }}
                                    labelStyle={{ color: "#F5F6FA" }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Top 10 Clientes */}
            <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                        Top 10 Clientes — {data.anoSelecionado}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={Math.max(350, top10Data.length * 42)}>
                        <BarChart data={top10Data} layout="vertical" margin={{ left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                            <XAxis type="number" tickFormatter={formatMoney} fontSize={11} />
                            <YAxis
                                type="category"
                                dataKey="nome"
                                width={160}
                                fontSize={12}
                                tick={{ fill: "hsl(var(--foreground))" }}
                            />
                            <Tooltip
                                formatter={(val: number) => formatMoneyFull(val)}
                                labelFormatter={(label: string) => {
                                    const match = top10Data.find((d) => d.nome === label);
                                    return match?.nomeCompleto || label;
                                }}
                                contentStyle={tooltipStyle}
                                itemStyle={{ color: "#F5F6FA" }}
                                labelStyle={{ color: "#F5F6FA" }}
                            />
                            <Bar dataKey="valor" name="Valor" radius={[0, 6, 6, 0]}>
                                {top10Data.map((_, index) => (
                                    <Cell
                                        key={index}
                                        fill={TOP10_COLORS[Math.min(index, TOP10_COLORS.length - 1)]}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}
