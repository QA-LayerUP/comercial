import type { Profile } from "@/lib/types/database";

export type UserRole = "admin" | "financeiro" | "vendas";

/** Retorna true se o perfil está ativo e tem um dos roles indicados */
function hasRole(profile: Profile | null | undefined, roles: UserRole[]): boolean {
    if (!profile || !profile.ativo) return false;
    return (roles as string[]).includes(profile.role);
}

// ── Vendas ──────────────────────────────────────────────────────────────────
export const canCreateVenda   = (p: Profile | null | undefined) => hasRole(p, ["admin", "financeiro", "vendas"]);
export const canEditVenda     = (p: Profile | null | undefined) => hasRole(p, ["admin", "financeiro", "vendas"]);
export const canDeleteVenda   = (p: Profile | null | undefined) => hasRole(p, ["admin", "financeiro"]);

// ── Clientes ─────────────────────────────────────────────────────────────────
export const canCreateCliente = (p: Profile | null | undefined) => hasRole(p, ["admin", "financeiro", "vendas"]);
export const canEditCliente   = (p: Profile | null | undefined) => hasRole(p, ["admin", "financeiro", "vendas"]);
export const canDeleteCliente = (p: Profile | null | undefined) => hasRole(p, ["admin", "financeiro"]);

// ── Comissões ─────────────────────────────────────────────────────────────────
export const canDownloadComissoes = (p: Profile | null | undefined) => hasRole(p, ["admin", "financeiro"]);

// ── Admin — Metas ─────────────────────────────────────────────────────────────
export const canViewMetas  = (p: Profile | null | undefined) => hasRole(p, ["admin", "financeiro"]);
export const canEditMetas  = (p: Profile | null | undefined) => hasRole(p, ["admin"]);

// ── Admin — Equipe ────────────────────────────────────────────────────────────
export const canViewAdminEquipe   = (p: Profile | null | undefined) => hasRole(p, ["admin", "financeiro"]);
export const canManageAdminEquipe = (p: Profile | null | undefined) => hasRole(p, ["admin", "financeiro"]);

// ── Admin — Exclusivo admin ───────────────────────────────────────────────────
export const canManageUsers      = (p: Profile | null | undefined) => hasRole(p, ["admin"]);
export const canEditRegras       = (p: Profile | null | undefined) => hasRole(p, ["admin"]);
export const canRecalcularComiss = (p: Profile | null | undefined) => hasRole(p, ["admin"]);

// ── Guard genérico ────────────────────────────────────────────────────────────
export const isAdmin      = (p: Profile | null | undefined) => hasRole(p, ["admin"]);
export const isFinanceiro = (p: Profile | null | undefined) => hasRole(p, ["financeiro"]);
export const isVendas     = (p: Profile | null | undefined) => hasRole(p, ["vendas"]);
