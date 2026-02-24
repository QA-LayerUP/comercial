"use client";

import {
    Bar,
    BarChart,
    Line,
    LineChart,
    XAxis,
    YAxis,
    CartesianGrid,
    ResponsiveContainer,
    Legend,
    Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MESES, CORES_CATEGORIA } from "@/lib/utils";

interface ChartData {
    realizadoPorCategoria: Record<string, { total: number; qtd: number }>;
    metasPorCategoria: Record<string, number>;
    realizadoAnterior: Record<string, number>;
    mensalAtual: Record<number, number>;
    mensalAnterior: Record<number, number>;
    mensalPorCategoria: Record<number, Record<string, number>>;
    anoSelecionado: number;
    anoAnterior: number;
}

const formatMoney = (val: number) => {
    if (val >= 1000000) return `R$ ${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `R$ ${(val / 1000).toFixed(0)}K`;
    return `R$ ${val.toFixed(0)}`;
};

export function DashboardCharts({ data }: { data: ChartData }) {
    const categorias = [
        ...new Set([
            ...Object.keys(data.realizadoPorCategoria),
            ...Object.keys(data.metasPorCategoria),
        ]),
    ];

    // Chart 1: Meta vs Realizado
    const metaRealizadoData = categorias.map((cat) => ({
        categoria: cat,
        Meta: data.metasPorCategoria[cat] || 0,
        Realizado: data.realizadoPorCategoria[cat]?.total || 0,
    }));

    // Chart 2: YoY
    const yoyCategorias = [
        ...new Set([
            ...Object.keys(data.realizadoPorCategoria),
            ...Object.keys(data.realizadoAnterior),
        ]),
    ];
    const yoyData = yoyCategorias.map((cat) => ({
        categoria: cat,
        [data.anoAnterior]: data.realizadoAnterior[cat] || 0,
        [data.anoSelecionado]: data.realizadoPorCategoria[cat]?.total || 0,
    }));

    // Chart 3: Mensal por categoria
    const mensalData = Array.from({ length: 12 }, (_, i) => {
        const mes = i + 1;
        const entry: Record<string, string | number> = { mes: MESES[i] };
        categorias.forEach((cat) => {
            entry[cat] = data.mensalPorCategoria[mes]?.[cat] || 0;
        });
        return entry;
    });

    // Chart 4: Comparativo mensal
    const comparativoData = Array.from({ length: 12 }, (_, i) => ({
        mes: MESES[i],
        [data.anoAnterior]: data.mensalAnterior[i + 1] || 0,
        [data.anoSelecionado]: data.mensalAtual[i + 1] || 0,
    }));

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Meta vs Realizado */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Meta vs Realizado por Categoria
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={metaRealizadoData}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis dataKey="categoria" fontSize={12} />
                                <YAxis tickFormatter={formatMoney} fontSize={11} />
                                <Tooltip
                                    formatter={(val: number) => formatMoney(val)}
                                    contentStyle={{
                                        borderRadius: "8px",
                                        border: "1px solid hsl(var(--border))",
                                        background: "hsl(var(--card))",
                                    }}
                                />
                                <Legend />
                                <Bar dataKey="Meta" fill="#6c757d" opacity={0.4} radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Realizado" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* YoY */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Comparativo Anual ({data.anoSelecionado} vs {data.anoAnterior})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={yoyData}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis dataKey="categoria" fontSize={12} />
                                <YAxis tickFormatter={formatMoney} fontSize={11} />
                                <Tooltip
                                    formatter={(val: number) => formatMoney(val)}
                                    contentStyle={{
                                        borderRadius: "8px",
                                        border: "1px solid hsl(var(--border))",
                                        background: "hsl(var(--card))",
                                    }}
                                />
                                <Legend />
                                <Bar
                                    dataKey={data.anoAnterior.toString()}
                                    fill="#6c757d"
                                    opacity={0.5}
                                    radius={[4, 4, 0, 0]}
                                />
                                <Bar
                                    dataKey={data.anoSelecionado.toString()}
                                    fill="#3b82f6"
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Evolução Mensal */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                        Evolução Mensal {data.anoSelecionado}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={mensalData}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="mes" fontSize={12} />
                            <YAxis tickFormatter={formatMoney} fontSize={11} />
                            <Tooltip
                                formatter={(val: number) => formatMoney(val)}
                                contentStyle={{
                                    borderRadius: "8px",
                                    border: "1px solid hsl(var(--border))",
                                    background: "hsl(var(--card))",
                                }}
                            />
                            <Legend />
                            {categorias.map((cat) => (
                                <Line
                                    key={cat}
                                    type="monotone"
                                    dataKey={cat}
                                    stroke={CORES_CATEGORIA[cat]?.border || "#999"}
                                    strokeWidth={2}
                                    dot={{ r: 3 }}
                                    activeDot={{ r: 5 }}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Comparativo Mensal */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                        Comparativo Mensal ({data.anoSelecionado} vs {data.anoAnterior})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={comparativoData}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="mes" fontSize={12} />
                            <YAxis tickFormatter={formatMoney} fontSize={11} />
                            <Tooltip
                                formatter={(val: number) => formatMoney(val)}
                                contentStyle={{
                                    borderRadius: "8px",
                                    border: "1px solid hsl(var(--border))",
                                    background: "hsl(var(--card))",
                                }}
                            />
                            <Legend />
                            <Bar
                                dataKey={data.anoAnterior.toString()}
                                fill="#6c757d"
                                opacity={0.5}
                                radius={[4, 4, 0, 0]}
                            />
                            <Bar
                                dataKey={data.anoSelecionado.toString()}
                                fill="#3b82f6"
                                radius={[4, 4, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}
