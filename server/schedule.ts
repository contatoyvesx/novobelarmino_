import type { Express, Request, Response } from "express";
import express from "express";
import { novoAgendamentoSchema } from "./validation";
import { sql } from "./supabase";
import { auth } from "./firebase"; // 🔥 IMPORTANTE

/* ================= TIPOS ================= */

interface AgendaConfig {
  abre: string;
  fecha: string;
  duracao: number;
}

interface Intervalo {
  inicio: string;
  fim: string;
}

/* ================= UTILS ================= */

const toMin = (h: string) => {
  const [hh, mm] = h.split(":").map(Number);
  return hh * 60 + mm;
};

const toHora = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

/* ================= DB ================= */

async function carregarConfigAgenda(barbeiroId: string, data: string): Promise<AgendaConfig> {
  const [y, m, d] = data.split("-").map(Number);
  const diaSemana = new Date(y, m - 1, d).getDay();

  const config = await sql<AgendaConfig[]>`
    select abre, fecha, duracao
    from agenda_config
    where barbeiro_id = ${Number(barbeiroId)}
      and dia_semana = ${diaSemana}
    limit 1
  `;

  if (!config.length) {
    throw new Error(`Sem agenda para dia_semana=${diaSemana}`);
  }

  return config[0];
}

/* ================= ROTAS ================= */

function agendarRoute(app: Express) {
  app.use(express.json());

  app.post("/api/agendar", async (req: Request, res: Response) => {
    try {
      // 🔐 1. PEGAR TOKEN
      const token = req.headers.authorization?.split("Bearer ")[1];

      if (!token) {
        return res.status(401).json({ mensagem: "Não autenticado" });
      }

      // 🔐 2. VALIDAR TOKEN
      const decoded = await auth.verifyIdToken(token);

      const userName = decoded.name || "Cliente";

      // 🔎 3. VALIDAR BODY
      const parsed = novoAgendamentoSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({ erro: parsed.error });
      }

      const { data, hora, barbeiro_id, telefone, servico } = parsed.data;

      // 🔧 4. LÓGICA NORMAL
      const config = await carregarConfigAgenda(barbeiro_id, data);
      const inicio = hora;
      const fim = toHora(toMin(hora) + config.duracao);

      const conflito = await sql<{ id: number }[]>`
        select id
        from agendamentos
        where data = ${data}
          and barbeiro_id = ${Number(barbeiro_id)}
          and inicio = ${inicio}
          and status <> 'cancelado'
        limit 1
      `;

      if (conflito.length) {
        return res.status(409).json({
          mensagem: "Horário já ocupado",
        });
      }

      // 💾 5. SALVAR (nome vem do Google)
      await sql`
        insert into agendamentos (
          barbeiro_id,
          cliente,
          telefone,
          servico,
          data,
          inicio,
          fim,
          status
        ) values (
          ${Number(barbeiro_id)},
          ${userName},
          ${telefone},
          ${servico},
          ${data},
          ${inicio},
          ${fim},
          'confirmado'
        )
      `;

      return res.status(201).json({
        mensagem: "Agendamento confirmado",
        usuario: userName,
      });
    } catch (e: any) {
      return res.status(401).json({
        mensagem: "Token inválido",
        detalhe: e?.message,
      });
    }
  });
}

/* ================= EXPORT ================= */

export function registrarRotasDeAgenda(app: Express) {
  agendarRoute(app);
}
