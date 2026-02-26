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
    cargo: string;
    valor: number;
}

const CARGO_COLORS: Record<string, string> = {
    SDR:                    "#E91E8C",
    Vendedor:               "#3A86FF",
    Estrategia:             "#8B5CF6",
    "Gestao de projetos":   "#00C896",
    "Customer Success":     "#FFC857",
};

const CARGO_LABELS: Record<string, string> = {
    "Gestao de projetos": "Gestão de Projetos",
};

const fmtCompact = (val: number) => {
    if (val >= 1_000_000) return `R$${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `R$${(val / 1_000).toFixed(0)}K`;
    return `R$${val.toFixed(0)}`;
};

const fmtFull = (val: number) =>
    new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(val);

interface TooltipPayload {
    value: number;
    payload: VendedorData;
}

function CustomTooltip({
    active,
    payload,
    label,
}: {
    active?: boolean;
    payload?: TooltipPayload[];
    label?: string;
}) {
    if (!active || !payload?.length) return null;
    const d = payload[0];
    const cargo = d.payload.cargo;
    const color = CARGO_COLORS[cargo] ?? "#94A3B8";
    const cargoLabel = CARGO_LABELS[cargo] ?? cargo;

    return (
        <div className="bg-[#1A1A1A] text-[#F5F6FA] rounded-xl px-4 py-3 shadow-2xl text-[13px] min-w-[160px]">
            <p className="font-semibold text-white mb-1">{d.payload.nomeCompleto || label}</p>
            <p className="flex items-center gap-1.5 text-[#BDBDBD] mb-2 text-xs">
                <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: color }}
                />
                {cargoLabel}
            </p>
            <p className="font-mono font-bold text-white text-base">{fmtFull(d.value)}</p>
        </div>
    );
}

export function EquipeChart({ data }: { data: VendedorData[] }) {
    if (data.length === 0) return null;
    const chartHeight = Math.max(280, data.length * 48);

    return (
        <Card className="rounded-2xl border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Ranking de Vendas
                    </CardTitle>
                    {/* Legenda de cargos */}
                    <div className="flex flex-wrap gap-3">
                        {Object.entries(CARGO_COLORS).map(([cargo, color]) => {
                            if (!data.some((d) => d.cargo === cargo)) return null;
                            return (
                                <span key={cargo} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <span
                                        className="w-2.5 h-2.5 rounded-sm shrink-0"
                                        style={{ background: color }}
                                    />
                                    {CARGO_LABELS[cargo] ?? cargo}
                                </span>
                            );
                        })}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={chartHeight}>
                    <BarChart
                        data={data}
                        layout="vertical"
                        margin={{ left: 8, right: 16, top: 4, bottom: 4 }}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="rgba(0,0,0,0.06)"
                            horizontal={false}
                        />
                        <XAxis
                            type="number"
                            tickFormatter={fmtCompact}
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: "#94A3B8" }}
                        />
                        <YAxis
                            type="category"
                            dataKey="nome"
                            width={90}
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: "currentColor" }}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
                        <Bar dataKey="valor" name="Vendas" radius={[0, 6, 6, 0]} maxBarSize={28}>
                            {data.map((d, i) => (
                                <Cell
                                    key={i}
                                    fill={CARGO_COLORS[d.cargo] ?? "#94A3B8"}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
