"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Loader2, Trash2 } from "lucide-react";
import { addSalesPerson, toggleSalesPerson, deleteSalesPerson } from "@/lib/actions/admin";
import { CARGOS } from "@/lib/utils";
import { toast } from "sonner";
import type { SalesPerson } from "@/lib/types/database";

export function EquipeManager({ salesPeople }: { salesPeople: SalesPerson[] }) {
    const [loading, setLoading] = useState(false);

    async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const result = await addSalesPerson(formData);
        setLoading(false);
        if (result.error) toast.error(result.error);
        else { toast.success("Profissional adicionado!"); (e.target as HTMLFormElement).reset(); }
    }

    const grouped = CARGOS.reduce((acc, cargo) => {
        acc[cargo] = salesPeople.filter((sp) => sp.cargo === cargo);
        return acc;
    }, {} as Record<string, SalesPerson[]>);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm">Adicionar Profissional</CardTitle></CardHeader>
                <CardContent>
                    <form onSubmit={handleAdd} className="flex gap-3 items-end">
                        <div className="flex-1"><Input name="nome" placeholder="Nome" required /></div>
                        <select name="cargo" className="h-9 rounded-md border border-input bg-background px-3 text-sm" required>
                            {CARGOS.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <Button type="submit" size="sm" disabled={loading}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 mr-1" />Adicionar</>}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {CARGOS.map((cargo) => (
                <Card key={cargo}>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm">{cargo} ({grouped[cargo]?.length || 0})</CardTitle>
                    </CardHeader>
                    <Table>
                        <TableBody>
                            {grouped[cargo]?.map((sp) => (
                                <TableRow key={sp.id}>
                                    <TableCell className="font-medium">{sp.nome}</TableCell>
                                    <TableCell>
                                        <Badge variant={sp.ativo ? "default" : "outline"}>{sp.ativo ? "Ativo" : "Inativo"}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={async () => { await toggleSalesPerson(sp.id, sp.ativo); toast.success("Status atualizado."); }}>
                                            {sp.ativo ? "Desativar" : "Ativar"}
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-destructive" onClick={async () => { if (confirm("Excluir?")) { await deleteSalesPerson(sp.id); toast.success("Excluído."); } }}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {(!grouped[cargo] || grouped[cargo].length === 0) && (
                                <TableRow><TableCell className="text-muted-foreground text-center" colSpan={3}>Nenhum profissional</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </Card>
            ))}
        </div>
    );
}
