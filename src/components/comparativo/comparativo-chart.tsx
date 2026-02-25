"use client";

import {
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
import { MESES } from "@/lib/utils";

interface ComparativoChartData {
    mensalAtual: Record<number, number>;
    mensalAnterior: Record<number, number>;
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

const tooltipStyle = {
    borderRadius: "8px",
    border: "none",
    background: "#1A1A1A",
    color: "#F5F6FA",
    fontSize: "13px",
};

export function ComparativoChart({ data }: { data: ComparativoChartData }) {
    const chartData = Array.from({ length: 12 }, (_, i) => ({
        mes: MESES[i],
        [data.anoSelecionado]: data.mensalAtual[i + 1] || 0,
        [data.anoAnterior]: data.mensalAnterior[i + 1] || 0,
    }));

    return (
        <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Evolução Mensal</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={380}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="mes" fontSize={12} />
                        <YAxis tickFormatter={formatMoney} fontSize={11} />
                        <Tooltip
                            formatter={(val: number) => formatMoneyFull(val)}
                            contentStyle={tooltipStyle}
                        />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey={data.anoSelecionado.toString()}
                            stroke="#E91E8C"
                            strokeWidth={2.5}
                            dot={{ r: 4, fill: "#E91E8C" }}
                            activeDot={{ r: 6 }}
                        />
                        <Line
                            type="monotone"
                            dataKey={data.anoAnterior.toString()}
                            stroke="#BDBDBD"
                            strokeWidth={2}
                            strokeDasharray="6 4"
                            dot={{ r: 3, fill: "#BDBDBD" }}
                            activeDot={{ r: 5 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
