import type { Express, Request, Response } from "express";
import express from "express";
import { novoAgendamentoSchema } from "./validation";
import { sql } from "./supabase";
import { auth } from "./firebase";

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

async function carregarConfigAgenda(
  barbeiroId: string,
  data: string
): Promise<AgendaConfig> {
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

async function carregarAgendamentos(
  data: string,
  barbeiroId: string
): Promise<Intervalo[]> {
  return await sql<Intervalo[]>`
    select inicio, fim
    from agendamentos
    where data = ${data}
      and barbeiro_id = ${Number(barbeiroId)}
      and status <> 'cancelado'
  `;
}

async function carregarBloqueios(
  data: string,
  barbeiroId: string
): Promise<Intervalo[]> {
  return await sql<Intervalo[]>`
    select inicio, fim
    from bloqueios
    where data = ${data}
      and barbeiro_id = ${Number(barbeiroId)}
  `;
}

/* ================= LÓGICA ================= */

function gerarHorarios(config: AgendaConfig): string[] {
  const horarios: string[] = [];

  for (
    let m = toMin(config.abre);
    m + config.duracao <= toMin(config.fecha);
    m += config.duracao
  ) {
    horarios.push(toHora(m));
  }

  return horarios;
}

function removerOcupados(
  base: string[],
  intervalos: Intervalo[],
  passo: number
) {
  const ocupados = new Set(
    intervalos.flatMap(({ inicio, fim }) => {
      const result: string[] = [];

      for (let m = toMin(inicio); m < toMin(fim); m += passo) {
        result.push(toHora(m));
      }

      return result;
    })
  );

  return base.filter((hora) => !ocupados.has(hora));
}

/* ================= ROTAS ================= */

function horariosRoute(app: Express) {
  app.get("/api/horarios", async (req: Request, res: Response) => {
    const data = String(req.query.data || "");
    const barbeiroId = String(req.query.barbeiro_id || "");

    if (!data || !barbeiroId) {
      return res.status(400).json({
        mensagem: "Data e barbeiro_id são obrigatórios.",
      });
    }

    try {
      const config = await carregarConfigAgenda(barbeiroId, data);
      const agendamentos = await carregarAgendamentos(data, barbeiroId);
      const bloqueios = await carregarBloqueios(data, barbeiroId);

      const base = gerarHorarios(config);
      const semAgendamentos = removerOcupados(base, agendamentos, config.duracao);
      const livres = removerOcupados(semAgendamentos, bloqueios, config.duracao);

      return res.json(livres);
    } catch (e: any) {
      console.error("Erro em /api/horarios:", e);

      return res.status(500).json({
        mensagem: "Erro ao buscar horários.",
        detalhe: e?.message,
      });
    }
  });
}

function agendarRoute(app: Express) {
  app.use(express.json());

  app.post("/api/agendar", async (req: Request, res: Response) => {
    const token = req.headers.authorization?.split("Bearer ")[1];

    if (!token) {
      return res.status(401).json({ mensagem: "Não autenticado" });
    }

    let userName = "Cliente";

    try {
      const decoded = await auth.verifyIdToken(token);
      userName = decoded.name || decoded.email || "Cliente";
    } catch (e: any) {
      return res.status(401).json({
        mensagem: "Token inválido",
        detalhe: e?.message,
      });
    }

    const parsed = novoAgendamentoSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        mensagem: "Dados inválidos.",
        erro: parsed.error,
      });
    }

    const { data, hora, barbeiro_id, telefone, servico } = parsed.data;

    try {
      const total = await sql<{ count: number }[]>`
        select count(*)::int as count
        from agendamentos
        where cliente = ${userName}
          and status <> 'cancelado'
      `;

      if ((total[0]?.count ?? 0) >= 4) {
        return res.status(400).json({
          mensagem: "Você atingiu o limite de 4 agendamentos.",
        });
      }

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
      console.error("Erro em /api/agendar:", e);

      return res.status(500).json({
        mensagem: "Erro ao confirmar agendamento.",
        detalhe: e?.message,
      });
    }
  });
}

function meusAgendamentosRoute(app: Express) {
  app.get("/api/meus-agendamentos", async (req: Request, res: Response) => {
    const token = req.headers.authorization?.split("Bearer ")[1];

    if (!token) {
      return res.status(401).json({ mensagem: "Não autenticado" });
    }

    let userName = "";

    try {
      const decoded = await auth.verifyIdToken(token);
      userName = decoded.name || decoded.email || "";
    } catch (e: any) {
      return res.status(401).json({
        mensagem: "Token inválido",
        detalhe: e?.message,
      });
    }

    try {
      const agendamentos = await sql`
        select id, data, inicio, fim, servico, status
        from agendamentos
        where cliente = ${userName}
        order by data desc, inicio desc
      `;

      return res.json(agendamentos);
    } catch (e: any) {
      console.error("Erro em /api/meus-agendamentos:", e);

      return res.status(500).json({
        mensagem: "Erro ao buscar agendamentos",
        detalhe: e?.message,
      });
    }
  });
}

/* ================= EXPORT ================= */

export function registrarRotasDeAgenda(app: Express) {
  horariosRoute(app);
  agendarRoute(app);
  meusAgendamentosRoute(app);
}
