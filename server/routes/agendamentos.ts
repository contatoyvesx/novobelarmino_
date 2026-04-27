import type { Request, Response } from "express";
import { sql } from "../db";

export async function listarAgendamentos(req: Request, res: Response) {
  try {
    const { data, barbeiro_id } = req.query;

    if (!data || !barbeiro_id) {
      return res.status(400).json({
        error: "data e barbeiro_id são obrigatórios",
      });
    }

    const rows = await sql`
      select id, barbeiro_id, cliente, telefone, servico, data, inicio, fim, status
      from agendamentos
      where data = ${String(data)}
        and barbeiro_id = ${Number(barbeiro_id)}
      order by inicio asc
    `;

    res.json(rows);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: "Erro ao listar agendamentos" });
  }
}

export async function criarAgendamento(req: Request, res: Response) {
  try {
    const { barbeiro_id, cliente, telefone, servico, data, inicio, fim } = req.body;

    if (!barbeiro_id || !cliente || !telefone || !servico || !data || !inicio || !fim) {
      return res.status(400).json({ error: "Campos obrigatórios faltando" });
    }

    const conflito = await sql`
      select id
      from agendamentos
      where data = ${data}
        and barbeiro_id = ${Number(barbeiro_id)}
        and inicio = ${inicio}
        and status <> 'cancelado'
      limit 1
    `;

    if (conflito.length) {
      return res.status(409).json({ error: "Horário já ocupado" });
    }

    const [novo] = await sql`
      insert into agendamentos (
        barbeiro_id, cliente, telefone, servico, data, inicio, fim, status
      ) values (
        ${Number(barbeiro_id)}, ${cliente}, ${telefone}, ${servico}, ${data}, ${inicio}, ${fim}, 'pendente'
      )
      returning id, barbeiro_id, cliente, telefone, servico, data, inicio, fim, status
    `;

    res.status(201).json(novo);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar agendamento" });
  }
}

export async function atualizarStatusAgendamento(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    if (!id || !status) {
      return res.status(400).json({ error: "id e status são obrigatórios" });
    }

    if (!["pendente", "confirmado", "cancelado"].includes(status)) {
      return res.status(400).json({ error: "status inválido" });
    }

    const [atualizado] = await sql`
      update agendamentos
      set status = ${status}
      where id = ${id}
      returning id, status
    `;

    if (!atualizado) {
      return res.status(404).json({ error: "Agendamento não encontrado" });
    }

    res.json(atualizado);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: "Erro ao atualizar status" });
  }
}