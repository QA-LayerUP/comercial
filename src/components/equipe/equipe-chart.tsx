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
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

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

const RANK_COLORS = ["#FFC857", "#C0C0C0", "#CD7F32", "#E91E8C", "#E91E8C", "#3A86FF", "#3A86FF", "#3A86FF"];

// Custom tooltip with proper white text
function CustomTooltip({ active, payload, label, data }: any) {
    if (!active || !payload?.length) return null;
    const match = data.find((d: VendedorData) => d.nome === label);
    return (
        <div className="rounded-xl border-0 px-4 py-3 shadow-lg" style={{ background: "#1A1A1A" }}>
            <p className="text-sm font-semibold" style={{ color: "#FFFFFF" }}>
                {match?.nomeCompleto || label}
            </p>
            <p className="text-sm font-mono mt-0.5" style={{ color: "#FFC857" }}>
                {formatMoneyFull(payload[0].value)}
            </p>
        </div>
    );
}

export function EquipeChart({ data }: { data: VendedorData[] }) {
    const chartHeight = Math.max(300, data.length * 45);

    return (
        <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-0">
            <div className="flex items-center gap-2 px-6 py-4 border-b border-[#F1F1F1]">
                <BarChart3 className="w-4 h-4 text-[#E91E8C]" />
                <h3 className="font-semibold text-sm">Ranking de Vendas</h3>
            </div>
            <CardContent className="pt-4">
                <ResponsiveContainer width="100%" height={chartHeight}>
                    <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F1F1" horizontal={false} />
                        <XAxis type="number" tickFormatter={formatMoney} fontSize={11} stroke="#999" />
                        <YAxis
                            type="category"
                            dataKey="nome"
                            width={120}
                            fontSize={12}
                            tick={{ fill: "#616161" }}
                        />
                        <Tooltip
                            content={<CustomTooltip data={data} />}
                            cursor={{ fill: "rgba(233, 30, 140, 0.06)" }}
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
