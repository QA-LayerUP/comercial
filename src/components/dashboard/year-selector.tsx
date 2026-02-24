"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export function YearSelector({
    anos,
    anoSelecionado,
}: {
    anos: number[];
    anoSelecionado: number;
}) {
    const router = useRouter();

    return (
        <Select
            value={anoSelecionado.toString()}
            onValueChange={(val) => router.push(`/?ano=${val}`)}
        >
            <SelectTrigger className="w-28">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {anos.map((a) => (
                    <SelectItem key={a} value={a.toString()}>
                        {a}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
