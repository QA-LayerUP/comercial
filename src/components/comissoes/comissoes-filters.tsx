"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { SalesPerson } from "@/lib/types/database";

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

    return (
        <div className="flex flex-wrap gap-3 items-center">
            <select
                value={searchParams.get("ano") || ""}
                onChange={(e) => handleChange("ano", e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
                {anos.map((a) => (
                    <option key={a} value={a}>{a}</option>
                ))}
            </select>

            <select
                value={searchParams.get("mes") || "all"}
                onChange={(e) => handleChange("mes", e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
                <option value="all">Todos os meses</option>
                <option value="1">Janeiro</option>
                <option value="2">Fevereiro</option>
                <option value="3">Março</option>
                <option value="4">Abril</option>
                <option value="5">Maio</option>
                <option value="6">Junho</option>
                <option value="7">Julho</option>
                <option value="8">Agosto</option>
                <option value="9">Setembro</option>
                <option value="10">Outubro</option>
                <option value="11">Novembro</option>
                <option value="12">Dezembro</option>
            </select>

            <select
                value={searchParams.get("vendedor") || "all"}
                onChange={(e) => handleChange("vendedor", e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
                <option value="all">Todos vendedores</option>
                {vendedores.map((v) => (
                    <option key={v.id} value={v.id}>{v.nome}</option>
                ))}
            </select>
        </div>
    );
}
