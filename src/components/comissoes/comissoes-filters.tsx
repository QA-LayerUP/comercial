"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Filter, X } from "lucide-react";
import type { SalesPerson } from "@/lib/types/database";

const MESES = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const selectClass =
    "w-full h-10 rounded-lg border-transparent bg-[#F5F6FA] px-3 text-sm transition-colors focus:bg-white focus:border-[#FFC857] focus:ring-2 focus:ring-[#FFC857]/20 outline-none";

interface ComissoesFiltersProps {
    anos: number[];
    vendedores: SalesPerson[];
}

export function ComissoesFilters({ anos, vendedores }: ComissoesFiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    function handleChange(key: string, value: string) {
        const params = new URLSearchParams(searchParams.toString());
        if (value && value !== "all") {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        router.push(`/comissoes?${params.toString()}`);
    }

    function handleClear() {
        router.push("/comissoes");
    }

    const hasFilters = searchParams.get("mes") || searchParams.get("vendedor");

    return (
        <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-0">
            <CardContent className="p-0">
                <div className="flex items-center gap-2 px-6 py-4 border-b border-[#F1F1F1]">
                    <Filter className="w-4 h-4 text-[#E91E8C]" />
                    <h3 className="font-semibold text-sm">Filtros</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6">
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Ano</label>
                        <select
                            value={searchParams.get("ano") || ""}
                            onChange={(e) => handleChange("ano", e.target.value)}
                            className={selectClass}
                        >
                            {anos.map((a) => (
                                <option key={a} value={a}>{a}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Mês</label>
                        <select
                            value={searchParams.get("mes") || "all"}
                            onChange={(e) => handleChange("mes", e.target.value)}
                            className={selectClass}
                        >
                            <option value="all">Todos os meses</option>
                            {MESES.map((m, i) => (
                                <option key={i} value={i + 1}>{m}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Vendedor</label>
                        <select
                            value={searchParams.get("vendedor") || "all"}
                            onChange={(e) => handleChange("vendedor", e.target.value)}
                            className={selectClass}
                        >
                            <option value="all">Todos vendedores</option>
                            {vendedores.map((v) => (
                                <option key={v.id} value={v.id}>{v.nome}</option>
                            ))}
                        </select>
                    </div>
                </div>
                {hasFilters && (
                    <div className="px-6 pb-4">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleClear}
                            className="text-muted-foreground hover:text-[#1A1A1A]"
                        >
                            <X className="w-3.5 h-3.5 mr-1.5" />
                            Limpar filtros
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
