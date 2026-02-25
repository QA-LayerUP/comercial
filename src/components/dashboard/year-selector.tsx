"use client";

import { useRouter, usePathname } from "next/navigation";
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
    const pathname = usePathname();

    return (
        <Select
            value={anoSelecionado.toString()}
            onValueChange={(val) => router.push(`${pathname}?ano=${val}`)}
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
