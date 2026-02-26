import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatMoney(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatMoneyDecimal(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatMoneyCompact(value: number): string {
  if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}K`;
  return `R$ ${value.toFixed(0)}`;
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export const MESES = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
] as const;

export const CATEGORIAS = [
  "Novo Cliente",
  "Cliente Recorrente",
  "Horas Extras",
  "Renovacao",
] as const;

export const CARGOS = [
  "SDR",
  "Estrategia",
  "Vendedor",
  "Gestao de projetos",
  "Customer Success",
] as const;

export const ROLES = [
  { value: "admin",      label: "Admin",      color: "bg-red-500" },
  { value: "financeiro", label: "Financeiro", color: "bg-purple-500" },
  { value: "vendas",     label: "Vendas",     color: "bg-blue-500" },
] as const;

export interface ComissaoResult {
  /** Valor base usado para calcular comissão (valor/12 para Fee Mensal) */
  baseCalculo: number;
  /** Comissão total antes de dividir pelos vendedores */
  comissaoTotal: number;
  /** Comissão por vendedor — é o valor gravado em comissao_valor */
  comissaoPorVendedor: number;
  /** Comissão do SDR = 5 % da comissaoTotal */
  comissaoSDR: number;
}

/**
 * Calcula os valores de comissão conforme a regra:
 * - Fee Mensal: base = (valor - repasse) / 12
 * - Outros:     base = (valor - repasse)
 * - comissaoPorVendedor = base * pct / 100 / volumeSalesPeople
 * - comissaoSDR = base * pct / 100 * 5%
 */
export function calcComissao(
  tipo: string,
  valor: number,
  valorRepasse: number,
  comissaoPct: number,
  volumeSalesPeople: number
): ComissaoResult {
  const isFeeMenusal = tipo.trim().toLowerCase() === "fee mensal";
  const valorLiquido = valor - valorRepasse;
  const baseCalculo = isFeeMenusal ? valorLiquido / 12 : valorLiquido;
  const comissaoTotal = baseCalculo * (comissaoPct / 100);
  const vol = volumeSalesPeople > 0 ? volumeSalesPeople : 1;
  const comissaoPorVendedor = comissaoTotal / vol;
  const comissaoSDR = comissaoTotal * 0.05;
  return { baseCalculo, comissaoTotal, comissaoPorVendedor, comissaoSDR };
}

export const CORES_CATEGORIA: Record<string, { bg: string; border: string; tw: string }> = {
  "Novo Cliente": { bg: "rgba(40, 167, 69, 0.7)", border: "#28a745", tw: "bg-emerald-500" },
  "Cliente Recorrente": { bg: "rgba(23, 162, 184, 0.7)", border: "#17a2b8", tw: "bg-cyan-500" },
  "Horas Extras": { bg: "rgba(111, 66, 193, 0.7)", border: "#6f42c1", tw: "bg-purple-500" },
  "Renovacao": { bg: "rgba(255, 193, 7, 0.7)", border: "#ffc107", tw: "bg-amber-500" },
};
