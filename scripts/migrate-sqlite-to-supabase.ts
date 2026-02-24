/**
 * =====================================================
 * Migração: SQLite → Supabase PostgreSQL
 * =====================================================
 *
 * Uso:
 *   1. npm install better-sqlite3 @supabase/supabase-js dotenv
 *   2. Copie .env.local com as chaves do Supabase
 *   3. Execute: npx tsx scripts/migrate-sqlite-to-supabase.ts
 *
 * Pré-requisitos:
 *   - schema.sql já aplicado no Supabase (SQL Editor)
 *   - Usuário admin criado no Supabase Auth
 */

import Database from "better-sqlite3";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

// Carregar .env.local
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("❌ Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local");
    process.exit(1);
}

// Service role key para bypass de RLS
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// SQLite source
const DB_PATH = path.resolve(__dirname, "../../database/cadastro_comercial.db");

let db: Database.Database;

try {
    db = new Database(DB_PATH, { readonly: true });
    console.log(`✅ SQLite conectado: ${DB_PATH}`);
} catch (err) {
    console.error(`❌ Não foi possível abrir o SQLite: ${DB_PATH}`);
    console.error(err);
    process.exit(1);
}

// =====================================================
// Helpers
// =====================================================
function chunkArray<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }
    return chunks;
}

async function insertBatch(table: string, rows: Record<string, unknown>[]) {
    if (rows.length === 0) {
        console.log(`  ⏭️  ${table}: 0 registros, pulando`);
        return;
    }

    const chunks = chunkArray(rows, 500);
    let total = 0;

    for (const chunk of chunks) {
        const { error } = await supabase.from(table).insert(chunk);
        if (error) {
            console.error(`  ❌ Erro inserindo em ${table}:`, error.message);
            console.error(`     Primeiro registro:`, JSON.stringify(chunk[0]).slice(0, 200));
            throw error;
        }
        total += chunk.length;
    }

    console.log(`  ✅ ${table}: ${total} registros inseridos`);
}

// =====================================================
// Migração de cada tabela
// =====================================================

async function migrateClientes() {
    const rows = db.prepare("SELECT * FROM clientes ORDER BY id").all() as Record<string, unknown>[];

    const mapped = rows.map((r) => ({
        id: r.id,
        confidencialidade: r.confidencialidade || "",
        nome: r.nome || "",
        cnpj_cpf: r.cnpj_cpf || "",
        contato_nome: r.contato_nome || "",
        contato_email: r.contato_email || "",
        contato_telefone: r.contato_telefone || "",
        contrato_ativo: r.contrato_ativo === 1 || r.contrato_ativo === true,
        data_primeiro_contrato: r.data_primeiro_contrato && r.data_primeiro_contrato !== "" ? r.data_primeiro_contrato : null,
        data_renovacao: r.data_renovacao && r.data_renovacao !== "" ? r.data_renovacao : null,
        link_contrato: r.link_contrato || "",
        link_proposta: r.link_proposta || "",
        observacoes: r.observacoes || "",
    }));

    await insertBatch("clientes", mapped);
}

async function migrateSalesPeople() {
    const rows = db.prepare("SELECT * FROM sales_people ORDER BY id").all() as Record<string, unknown>[];

    const mapped = rows.map((r) => ({
        id: r.id,
        nome: r.nome || "",
        cargo: r.cargo,
        ativo: r.ativo === 1 || r.ativo === true,
    }));

    await insertBatch("sales_people", mapped);
}

async function migrateRegraComissao() {
    const rows = db.prepare("SELECT * FROM regra_comissao ORDER BY id").all() as Record<string, unknown>[];

    const mapped = rows.map((r) => ({
        id: r.id,
        produto: r.produto || "",
        categoria: r.categoria || "",
        perfil: r.perfil || "",
        tipo: r.tipo || "",
        especificacao: r.especificacao || "",
        vigencia: r.vigencia || "",
        comissao_percentual: Number(r.comissao_percentual) || 0,
    }));

    await insertBatch("regra_comissao", mapped);
}

async function migrateDropdownOptions() {
    const rows = db.prepare("SELECT * FROM dropdown_options ORDER BY id").all() as Record<string, unknown>[];

    const mapped = rows.map((r) => ({
        id: r.id,
        produto: r.produto || "",
        categoria: r.categoria || null,
        perfil: r.perfil || null,
        tipo: r.tipo || null,
        especificacao: r.especificacao || null,
        vigencia: r.vigencia || null,
    }));

    await insertBatch("dropdown_options", mapped);
}

async function migrateVendas() {
    const rows = db.prepare("SELECT * FROM vendas ORDER BY id").all() as Record<string, unknown>[];

    const mapped = rows.map((r) => ({
        id: r.id,
        ano: r.ano,
        mes: r.mes,
        nome_cliente: r.nome_cliente || "",
        cliente_id: r.cliente_id || null,
        venda_codigo: r.venda_codigo || "",
        produto: r.produto || "",
        categoria: r.categoria || "",
        perfil: r.perfil || "",
        tipo: r.tipo || "",
        especificacao: r.especificacao || "",
        vigencia: r.vigencia || "",
        valor: Number(r.valor) || 0,
        repasse_desconto: r.repasse_desconto || "",
        valor_repasse: Number(r.valor_repasse) || 0,
        valor_calculo_comissao: Number(r.valor_calculo_comissao) || 0,
        volume_horas: Number(r.volume_horas) || 0,
        valor_por_hora: Number(r.valor_por_hora) || 0,
        volume_sales_people: Number(r.volume_sales_people) || 1,
        estrategia1_id: r.estrategia1_id || null,
        estrategia2_id: r.estrategia2_id || null,
        vendedor1_id: r.vendedor1_id || null,
        vendedor2_id: r.vendedor2_id || null,
        gestao_projetos_id: r.gestao_projetos_id || null,
        customer_success_id: r.customer_success_id || null,
        sdr_id: r.sdr_id || null,
        comissao_percentual: Number(r.comissao_percentual) || 0,
        comissao_valor: Number(r.comissao_valor) || 0,
        observacoes: r.observacoes || "",
        created_by: null, // sem mapeamento de user IDs antigos
    }));

    await insertBatch("vendas", mapped);
}

async function migrateMetas() {
    const rows = db.prepare("SELECT * FROM metas ORDER BY id").all() as Record<string, unknown>[];

    const mapped = rows.map((r) => ({
        id: r.id,
        ano: r.ano,
        categoria: r.categoria || "",
        mes: r.mes || null,
        valor_meta: Number(r.valor_meta) || 0,
    }));

    await insertBatch("metas", mapped);
}

// =====================================================
// Reset de sequences (para que novos IDs continuem corretos)
// =====================================================
async function resetSequences() {
    const tables = ["clientes", "sales_people", "regra_comissao", "dropdown_options", "vendas", "metas"];

    for (const table of tables) {
        const { error } = await supabase.rpc("reset_sequence", { table_name: table });
        // Se a RPC não existir, tenta via SQL direto (requer service role)
        if (error) {
            // Alternativa: não bloqueia se falhar, apenas avisa
            console.log(`  ⚠️  Ajuste manual de sequence para ${table} pode ser necessário`);
        }
    }
}

// =====================================================
// Contagem pré-migração
// =====================================================
function countRows() {
    const tables = ["clientes", "sales_people", "regra_comissao", "dropdown_options", "vendas", "metas"];

    console.log("\n📊 Contagem de registros no SQLite:");
    for (const table of tables) {
        try {
            const row = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as { count: number };
            console.log(`   ${table}: ${row.count}`);
        } catch {
            console.log(`   ${table}: tabela não encontrada`);
        }
    }
    console.log("");
}

// =====================================================
// Execução Principal
// =====================================================
async function main() {
    console.log("🚀 Migração SQLite → Supabase");
    console.log("=".repeat(50));

    countRows();

    console.log("📦 Migrando dados...\n");

    // Ordem importa por causa das foreign keys
    console.log("1/6 Clientes");
    await migrateClientes();

    console.log("2/6 Equipe Comercial");
    await migrateSalesPeople();

    console.log("3/6 Regras de Comissão");
    await migrateRegraComissao();

    console.log("4/6 Dropdown Options");
    await migrateDropdownOptions();

    console.log("5/6 Vendas");
    await migrateVendas();

    console.log("6/6 Metas");
    await migrateMetas();

    console.log("\n🔧 Ajustando sequences...");
    await resetSequences();

    console.log("\n" + "=".repeat(50));
    console.log("✅ Migração concluída com sucesso!");
    console.log("\n📝 Próximos passos:");
    console.log("   1. Verifique os dados no Supabase Dashboard");
    console.log("   2. Crie o usuário admin: Supabase Auth → Users → Add User");
    console.log("   3. Atualize o role do admin: profiles → role = 'admin'");
    console.log("   4. Execute 'npm run dev' para testar\n");

    db.close();
}

main().catch((err) => {
    console.error("\n❌ Erro fatal na migração:", err);
    db.close();
    process.exit(1);
});
