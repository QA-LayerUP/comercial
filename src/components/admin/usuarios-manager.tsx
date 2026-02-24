"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Loader2, KeyRound } from "lucide-react";
import { createUser, updateUserRole, toggleUserActive, resetUserPassword } from "@/lib/actions/admin";
import { ROLES } from "@/lib/utils";
import { toast } from "sonner";
import type { Profile } from "@/lib/types/database";

const roleBadge = (role: string) => {
    const r = ROLES.find((r) => r.value === role);
    return (
        <Badge className={`${r?.color || "bg-gray-500"} text-white text-xs`}>
            {r?.label || role}
        </Badge>
    );
};

export function UsuariosManager({ users }: { users: Profile[] }) {
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [resetUserId, setResetUserId] = useState<string | null>(null);
    const [resetUserName, setResetUserName] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [resetting, setResetting] = useState(false);

    async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const result = await createUser(formData);
        setLoading(false);
        if (result.error) toast.error(result.error);
        else {
            toast.success("Usuário criado com sucesso!");
            (e.target as HTMLFormElement).reset();
            setShowForm(false);
        }
    }

    async function handleRoleChange(userId: string, newRole: string) {
        const result = await updateUserRole(userId, newRole);
        if (result.error) toast.error(result.error);
        else toast.success("Permissão atualizada!");
    }

    async function handleToggle(userId: string, currentAtivo: boolean) {
        const result = await toggleUserActive(userId, currentAtivo);
        if (result.error) toast.error(result.error);
        else toast.success(currentAtivo ? "Usuário desativado." : "Usuário ativado.");
    }

    async function handleResetPassword() {
        if (!resetUserId || newPassword.length < 6) {
            toast.error("A senha precisa ter no mínimo 6 caracteres.");
            return;
        }
        setResetting(true);
        const result = await resetUserPassword(resetUserId, newPassword);
        setResetting(false);
        if (result.error) toast.error(result.error);
        else {
            toast.success("Senha resetada com sucesso!");
            setResetUserId(null);
            setNewPassword("");
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Usuários</h1>
                    <p className="text-muted-foreground">{users.length} usuários cadastrados</p>
                </div>
                <Button size="sm" onClick={() => setShowForm(!showForm)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Usuário
                </Button>
            </div>

            {showForm && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Criar Novo Usuário</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                            <div>
                                <Label>Nome *</Label>
                                <Input name="nome" placeholder="Nome completo" required />
                            </div>
                            <div>
                                <Label>Email *</Label>
                                <Input name="email" type="email" placeholder="email@exemplo.com" required />
                            </div>
                            <div>
                                <Label>Senha *</Label>
                                <Input name="password" type="password" placeholder="Mínimo 6 chars" required minLength={6} />
                            </div>
                            <div>
                                <Label>Permissão</Label>
                                <select name="role" defaultValue="comercial" className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                                    {ROLES.map((r) => (
                                        <option key={r.value} value={r.value}>{r.label}</option>
                                    ))}
                                </select>
                            </div>
                            <Button type="submit" disabled={loading}>
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 mr-1" /> Criar</>}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Permissão</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((u) => (
                            <TableRow key={u.id}>
                                <TableCell className="font-medium">{u.nome}</TableCell>
                                <TableCell>
                                    <select
                                        value={u.role}
                                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                        className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                                    >
                                        {ROLES.map((r) => (
                                            <option key={r.value} value={r.value}>{r.label}</option>
                                        ))}
                                    </select>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={u.ativo ? "default" : "outline"}>
                                        {u.ativo ? "Ativo" : "Inativo"}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right space-x-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        title="Resetar Senha"
                                        onClick={() => { setResetUserId(u.id); setResetUserName(u.nome); setNewPassword(""); }}
                                    >
                                        <KeyRound className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleToggle(u.id, u.ativo)}
                                    >
                                        {u.ativo ? "Desativar" : "Ativar"}
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>

            {/* Modal Reset Senha */}
            <Dialog open={!!resetUserId} onOpenChange={(open) => { if (!open) setResetUserId(null); }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Resetar Senha</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <p className="text-sm text-muted-foreground">
                            Defina uma nova senha para <strong>{resetUserName}</strong>
                        </p>
                        <div className="space-y-2">
                            <Label>Nova Senha</Label>
                            <Input
                                type="password"
                                placeholder="Mínimo 6 caracteres"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                minLength={6}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setResetUserId(null)}>Cancelar</Button>
                        <Button onClick={handleResetPassword} disabled={resetting || newPassword.length < 6}>
                            {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Resetar Senha"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
