"use client";

import {
    Bar,
    BarChart,
    XAxis,
    YAxis,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface VendedorData {
    nome: string;
    nomeCompleto: string;
    valor: number;
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

const tooltipStyle = {
    borderRadius: "8px",
    border: "none",
    background: "#1A1A1A",
    color: "#F5F6FA",
    fontSize: "13px",
};

const RANK_COLORS = ["#00C896", "#00C896", "#00C896", "#3A86FF", "#3A86FF", "#3A86FF"];

export function EquipeChart({ data }: { data: VendedorData[] }) {
    const chartHeight = Math.max(300, data.length * 45);

    return (
        <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Ranking de Vendas</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={chartHeight}>
                    <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                        <XAxis type="number" tickFormatter={formatMoney} fontSize={11} />
                        <YAxis
                            type="category"
                            dataKey="nome"
                            width={120}
                            fontSize={12}
                            tick={{ fill: "hsl(var(--foreground))" }}
                        />
                        <Tooltip
                            formatter={(val: number) => formatMoneyFull(val)}
                            labelFormatter={(label: string) => {
                                const match = data.find((d) => d.nome === label);
                                return match?.nomeCompleto || label;
                            }}
                            contentStyle={tooltipStyle}
                        />
                        <Bar dataKey="valor" name="Vendas" radius={[0, 6, 6, 0]}>
                            {data.map((_, index) => (
                                <Cell
                                    key={index}
                                    fill={RANK_COLORS[Math.min(index, RANK_COLORS.length - 1)]}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
