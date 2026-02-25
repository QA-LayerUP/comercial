"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Loader2, KeyRound, Users2, ShieldCheck, UserCheck, UserX, X, Lock } from "lucide-react";
import { createUser, updateUserRole, toggleUserActive, resetUserPassword } from "@/lib/actions/admin";
import { ROLES } from "@/lib/utils";
import { toast } from "sonner";
import type { Profile } from "@/lib/types/database";

const inputClass = "h-10 bg-[#F5F6FA] border-transparent focus:bg-white focus:border-[#FFC857] focus:ring-2 focus:ring-[#FFC857]/20";
const selectClass = "h-10 rounded-lg border-transparent bg-[#F5F6FA] px-3 text-sm transition-colors focus:bg-white focus:border-[#FFC857] focus:ring-2 focus:ring-[#FFC857]/20 outline-none w-full";

const ROLE_STYLES: Record<string, { bg: string; text: string }> = {
    admin: { bg: "bg-[#E91E8C]/12", text: "text-[#E91E8C]" },
    comercial: { bg: "bg-[#3A86FF]/12", text: "text-[#3A86FF]" },
    visitante: { bg: "bg-[#F5F6FA]", text: "text-muted-foreground" },
};

export function UsuariosManager({ users }: { users: Profile[] }) {
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [resetUserId, setResetUserId] = useState<string | null>(null);
    const [resetUserName, setResetUserName] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [resetting, setResetting] = useState(false);

    const ativos = users.filter((u) => u.ativo).length;
    const admins = users.filter((u) => u.role === "admin").length;

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
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Usuários</h1>
                    <p className="text-sm text-muted-foreground">Gerenciar acessos e permissões</p>
                </div>
                <Button
                    className="bg-[#E91E8C] hover:bg-[#D4177F] text-white"
                    size="sm"
                    onClick={() => setShowForm(!showForm)}
                >
                    {showForm ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                    {showForm ? "Fechar" : "Novo Usuário"}
                </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-0 bg-[#FFC857] overflow-hidden relative">
                    <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/15 rounded-full" />
                    <CardContent className="p-5 relative">
                        <p className="text-xs text-[#1A1A1A]/50 uppercase tracking-wider font-medium">Total Usuários</p>
                        <p className="text-3xl font-bold text-[#1A1A1A] mt-1">{users.length}</p>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-0">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Ativos</p>
                                <p className="text-3xl font-bold mt-1 text-[#00C896]">{ativos}</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-[#00C896]/10 flex items-center justify-center">
                                <UserCheck className="w-5 h-5 text-[#00C896]" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-0">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Admins</p>
                                <p className="text-3xl font-bold mt-1 text-[#E91E8C]">{admins}</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-[#E91E8C]/10 flex items-center justify-center">
                                <ShieldCheck className="w-5 h-5 text-[#E91E8C]" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Create Form */}
            {showForm && (
                <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-0 overflow-hidden">
                    <div className="flex items-center gap-2 px-6 py-4 border-b border-[#F1F1F1]">
                        <Plus className="w-4 h-4 text-[#00C896]" />
                        <h3 className="font-semibold text-sm">Criar Novo Usuário</h3>
                    </div>
                    <CardContent className="p-6">
                        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nome *</Label>
                                <Input name="nome" placeholder="Nome completo" required className={inputClass} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email *</Label>
                                <Input name="email" type="email" placeholder="email@exemplo.com" required className={inputClass} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Senha *</Label>
                                <Input name="password" type="password" placeholder="Mín. 6 caracteres" required minLength={6} className={inputClass} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Permissão</Label>
                                <select name="role" defaultValue="comercial" className={selectClass}>
                                    {ROLES.map((r) => (
                                        <option key={r.value} value={r.value}>{r.label}</option>
                                    ))}
                                </select>
                            </div>
                            <Button type="submit" disabled={loading} className="bg-[#00C896] hover:bg-[#00B084] text-white h-10">
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 mr-1" /> Criar</>}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Users Table */}
            <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] overflow-hidden border-0">
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#F1F1F1]">
                    <div className="flex items-center gap-2">
                        <Users2 className="w-4 h-4 text-[#3A86FF]" />
                        <h3 className="font-semibold text-sm">Lista de Usuários</h3>
                    </div>
                    <span className="text-xs text-muted-foreground">{users.length} usuários</span>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow className="bg-[#F5F6FA] hover:bg-[#F5F6FA]">
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#616161]">Usuário</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#616161]">Permissão</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#616161]">Status</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#616161] text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((u) => {
                            const roleStyle = ROLE_STYLES[u.role] || ROLE_STYLES.visitante;
                            const roleLabel = ROLES.find((r) => r.value === u.role)?.label || u.role;

                            return (
                                <TableRow key={u.id} className="group hover:bg-[#F9F9FB] transition-colors">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#E91E8C]/20 to-[#3A86FF]/20 flex items-center justify-center text-sm font-bold text-[#1A1A1A]">
                                                {u.nome ? u.nome.charAt(0).toUpperCase() : "?"}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{u.nome}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <select
                                            value={u.role}
                                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                            className="h-8 rounded-lg border-transparent bg-[#F5F6FA] px-2.5 text-xs font-medium transition-colors focus:bg-white focus:border-[#FFC857] focus:ring-2 focus:ring-[#FFC857]/20 outline-none cursor-pointer"
                                        >
                                            {ROLES.map((r) => (
                                                <option key={r.value} value={r.value}>{r.label}</option>
                                            ))}
                                        </select>
                                    </TableCell>
                                    <TableCell>
                                        {u.ativo ? (
                                            <span className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#00C896]/12 text-[#00C896]">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#00C896] mr-1.5" />
                                                Ativo
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#F5F6FA] text-muted-foreground">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#D0D0D0] mr-1.5" />
                                                Inativo
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-lg hover:bg-[#FFC857]/10"
                                                title="Resetar Senha"
                                                onClick={() => { setResetUserId(u.id); setResetUserName(u.nome); setNewPassword(""); }}
                                            >
                                                <KeyRound className="w-4 h-4 text-[#FFC857]" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className={`rounded-lg text-xs h-8 ${u.ativo ? "hover:bg-red-50 text-red-500" : "hover:bg-[#00C896]/10 text-[#00C896]"}`}
                                                onClick={() => handleToggle(u.id, u.ativo)}
                                            >
                                                {u.ativo ? <><UserX className="w-3.5 h-3.5 mr-1" /> Desativar</> : <><UserCheck className="w-3.5 h-3.5 mr-1" /> Ativar</>}
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {users.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-12">
                                    <Users2 className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                                    <p className="text-muted-foreground">Nenhum usuário cadastrado</p>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>

            {/* Modal Reset Senha */}
            <Dialog open={!!resetUserId} onOpenChange={(open) => { if (!open) setResetUserId(null); }}>
                <DialogContent className="sm:max-w-md bg-white rounded-2xl">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#FFC857]/15 flex items-center justify-center">
                                <Lock className="w-5 h-5 text-[#FFC857]" />
                            </div>
                            <div>
                                <DialogTitle>Resetar Senha</DialogTitle>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Defina uma nova senha para <strong>{resetUserName}</strong>
                                </p>
                            </div>
                        </div>
                    </DialogHeader>
                    <div className="space-y-4 py-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nova Senha</Label>
                            <Input
                                type="password"
                                placeholder="Mínimo 6 caracteres"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                minLength={6}
                                className={inputClass}
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="ghost" onClick={() => setResetUserId(null)} className="text-muted-foreground">
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleResetPassword}
                            disabled={resetting || newPassword.length < 6}
                            className="bg-[#FFC857] hover:bg-[#F5B831] text-[#1A1A1A] font-semibold"
                        >
                            {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><KeyRound className="w-4 h-4 mr-2" /> Resetar Senha</>}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
