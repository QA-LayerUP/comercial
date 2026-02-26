"use client";

import {
    Area,
    AreaChart,
    XAxis,
    YAxis,
    CartesianGrid,
    ResponsiveContainer,
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
    dataKey: string;
    value: number;
    color: string;
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

    const atual = payload.find((p) => p.dataKey === payload[0]?.dataKey);
    const anterior = payload.find((p) => p.dataKey === payload[1]?.dataKey);

    const valAtual = atual?.value ?? 0;
    const valAnterior = anterior?.value ?? 0;
    const diff = valAtual - valAnterior;
    const pct =
        valAnterior > 0
            ? (((valAtual - valAnterior) / valAnterior) * 100).toFixed(1)
            : null;

    return (
        <div className="bg-[#1A1A1A] text-[#F5F6FA] rounded-xl px-4 py-3 shadow-2xl text-[13px] min-w-[180px]">
            <p className="font-semibold mb-2 text-white">{label}</p>
            {payload.map((p) => (
                <div key={p.dataKey} className="flex items-center justify-between gap-4 mb-1">
                    <span className="flex items-center gap-1.5 text-[#BDBDBD]">
                        <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ background: p.color }}
                        />
                        {p.dataKey}
                    </span>
                    <span className="font-mono font-semibold text-white">{fmtFull(p.value)}</span>
                </div>
            ))}
            {valAnterior > 0 && (
                <div
                    className={`mt-2 pt-2 border-t border-white/10 flex items-center justify-between`}
                >
                    <span className="text-[#BDBDBD]">Variação</span>
                    <span
                        className={`font-mono font-semibold ${
                            diff > 0 ? "text-[#00C896]" : diff < 0 ? "text-[#E63946]" : "text-[#BDBDBD]"
                        }`}
                    >
                        {diff > 0 ? "+" : ""}
                        {fmtFull(diff)}
                        {pct && ` (${diff > 0 ? "+" : ""}${pct}%)`}
                    </span>
                </div>
            )}
        </div>
    );
}

export function ComparativoChart({ data }: { data: ComparativoChartData }) {
    const chartData = Array.from({ length: 12 }, (_, i) => ({
        mes: MESES[i],
        [data.anoSelecionado]: data.mensalAtual[i + 1] || 0,
        [data.anoAnterior]: data.mensalAnterior[i + 1] || 0,
    }));

    const keyAtual = data.anoSelecionado.toString();
    const keyAnterior = data.anoAnterior.toString();

    return (
        <Card className="rounded-2xl border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Evolução Mensal
                    </CardTitle>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                            <span className="w-3 h-0.5 bg-[#E91E8C] rounded inline-block" />
                            {data.anoSelecionado}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-3 h-0.5 bg-[#BDBDBD] rounded inline-block border-dashed" />
                            {data.anoAnterior}
                        </span>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={360}>
                    <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="gradAtual" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#E91E8C" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#E91E8C" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="gradAnterior" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#BDBDBD" stopOpacity={0.15} />
                                <stop offset="95%" stopColor="#BDBDBD" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="rgba(0,0,0,0.06)"
                            vertical={false}
                        />
                        <XAxis
                            dataKey="mes"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: "#94A3B8" }}
                        />
                        <YAxis
                            tickFormatter={fmtCompact}
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: "#94A3B8" }}
                            width={64}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        {/* Anterior (atrás) */}
                        <Area
                            type="monotone"
                            dataKey={keyAnterior}
                            stroke="#BDBDBD"
                            strokeWidth={2}
                            strokeDasharray="6 4"
                            fill="url(#gradAnterior)"
                            dot={false}
                            activeDot={{ r: 5, fill: "#BDBDBD", strokeWidth: 0 }}
                        />
                        {/* Atual (na frente) */}
                        <Area
                            type="monotone"
                            dataKey={keyAtual}
                            stroke="#E91E8C"
                            strokeWidth={2.5}
                            fill="url(#gradAtual)"
                            dot={false}
                            activeDot={{ r: 6, fill: "#E91E8C", strokeWidth: 0 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
