"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
    { value: "", label: "Todos" },
    { value: "Vendedor", label: "Vendedor" },
    { value: "SDR", label: "SDR" },
    { value: "Estrategia", label: "Estratégia" },
    { value: "Gestao de projetos", label: "Gestão de Projetos" },
    { value: "Customer Success", label: "Customer Success" },
] as const;

export function CargoTabs({ cargo }: { cargo: string }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    function navigate(value: string) {
        const params = new URLSearchParams(searchParams.toString());
        if (value) params.set("cargo", value);
        else params.delete("cargo");
        router.push(`${pathname}?${params.toString()}`);
    }

    return (
        <div className="flex flex-wrap gap-1.5">
            {TABS.map((tab) => (
                <button
                    key={tab.value}
                    onClick={() => navigate(tab.value)}
                    className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                        cargo === tab.value
                            ? "bg-[#E91E8C] text-white shadow-sm"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
}
