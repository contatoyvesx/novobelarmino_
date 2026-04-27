import type { Express, Request, Response } from "express";
import { sql } from "./supabase";

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";

function auth(req: Request): boolean {
  const token =
    (req.headers["x-admin-token"] as string | undefined) ||
    (req.query.token as string | undefined) ||
    "";

  return ADMIN_TOKEN.length > 0 && token === ADMIN_TOKEN;
}

export function registrarRotasAdmin(app: Express) {
  // =========================
  // LISTAR BARBEIROS (NOME)
  // =========================
  app.get("/api/admin/barbeiros", async (req: Request, res: Response) => {
    if (!auth(req)) {
      return res.status(401).json({ mensagem: "Não autorizado" });
    }

    try {
      const barbeiros = await sql`
        select id, nome
        from barbeiros
        where ativo = true
        order by nome asc
      `;

      res.json({ barbeiros });
    } catch (e: any) {
      res.status(500).json({
        mensagem: "Erro ao listar barbeiros",
        detalhe: e?.message,
      });
    }
  });

  // =========================
  // LISTAR AGENDAMENTOS
  // =========================
  app.get("/api/admin/agendamentos", async (req: Request, res: Response) => {
    if (!auth(req)) {
      return res.status(401).json({ mensagem: "Não autorizado" });
    }

    const data = String(req.query.data || "").trim();
    const barbeiro_id = Number(req.query.barbeiro_id);

    if (!data || !barbeiro_id) {
      return res
        .status(400)
        .json({ mensagem: "data e barbeiro_id são obrigatórios" });
    }

    try {
      const agendamentos = await sql`
        select id, cliente, telefone, servico, data, inicio, fim, status
        from agendamentos
        where data = ${data}
          and barbeiro_id = ${barbeiro_id}
        order by inicio asc
      `;

      res.json({ agendamentos });
    } catch (e: any) {
      res.status(500).json({
        mensagem: "Erro ao listar agendamentos",
        detalhe: e?.message,
      });
    }
  });

  // =========================
  // ATUALIZAR STATUS
  // =========================
  app.patch("/api/admin/agendamentos/:id", async (req: Request, res: Response) => {
    if (!auth(req)) {
      return res.status(401).json({ mensagem: "Não autorizado" });
    }

    const id = Number(req.params.id);
    const status = String(req.body?.status ?? "").trim();

    if (!id || !status) {
      return res.status(400).json({ mensagem: "status obrigatório" });
    }

    try {
      const permitidos = ["pendente", "confirmado", "cancelado"];

      if (!permitidos.includes(status)) {
        return res.status(400).json({ mensagem: "status inválido" });
      }

      const updated = await sql`
        update agendamentos
        set status = ${status}
        where id = ${id}
        returning id, status
      `;

      if (!updated.length) {
        return res.status(404).json({ mensagem: "Agendamento não encontrado" });
      }

      res.json({ ok: true, agendamento: updated[0] });
    } catch (e: any) {
      res.status(500).json({
        mensagem: "Erro ao atualizar",
        detalhe: e?.message,
      });
    }
  });
}
