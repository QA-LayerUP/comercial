"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Save, Loader2 } from "lucide-react";
import { MESES, CATEGORIAS } from "@/lib/utils";
import { saveMetas } from "@/lib/actions/admin";
import { toast } from "sonner";

interface MetasGridProps {
    ano: number;
    initialMetas: Record<string, Record<number, number>>;
}

export function MetasGrid({ ano, initialMetas }: MetasGridProps) {
    const [loading, setLoading] = useState(false);
    const [metas, setMetas] = useState(initialMetas);

    function setMetaValue(cat: string, mes: number, val: number) {
        setMetas((prev) => ({
            ...prev,
            [cat]: { ...prev[cat], [mes]: val },
        }));
    }

    async function handleSave() {
        setLoading(true);
        const result = await saveMetas(ano, metas);
        setLoading(false);
        if (result.error) toast.error(result.error);
        else toast.success("Metas salvas com sucesso!");
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm">Metas {ano}</CardTitle>
                <Button size="sm" onClick={handleSave} disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" />Salvar</>}
                </Button>
            </CardHeader>
            <CardContent className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="sticky left-0 bg-background">Categoria</TableHead>
                            {MESES.map((m) => (
                                <TableHead key={m} className="text-center min-w-[80px]">{m}</TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {CATEGORIAS.map((cat) => (
                            <TableRow key={cat}>
                                <TableCell className="sticky left-0 bg-background font-medium text-sm whitespace-nowrap">{cat}</TableCell>
                                {Array.from({ length: 12 }, (_, i) => i + 1).map((mes) => (
                                    <TableCell key={mes} className="p-1">
                                        <Input
                                            type="number"
                                            className="w-20 h-8 text-xs text-right"
                                            value={metas[cat]?.[mes] || 0}
                                            onChange={(e) => setMetaValue(cat, mes, parseFloat(e.target.value) || 0)}
                                        />
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
