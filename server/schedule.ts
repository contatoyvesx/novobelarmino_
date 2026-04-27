import type { Express, Request, Response } from "express";
import express from "express";
import { horariosQuerySchema, novoAgendamentoSchema } from "./validation";
import { sql } from "./supabase";

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
  const agendamentos = await sql<Intervalo[]>`
    select inicio, fim
    from agendamentos
    where data = ${data}
      and barbeiro_id = ${Number(barbeiroId)}
      and status <> 'cancelado'
  `;

  return agendamentos;
}

async function carregarBloqueios(
  data: string,
  barbeiroId: string
): Promise<Intervalo[]> {
  const bloqueios = await sql<Intervalo[]>`
    select inicio, fim
    from bloqueios
    where data = ${data}
      and barbeiro_id = ${Number(barbeiroId)}
  `;

  return bloqueios;
}

/* ================= LÓGICA ================= */

function gerarHorarios(config: AgendaConfig): string[] {
  const h: string[] = [];
  for (
    let m = toMin(config.abre);
    m + config.duracao <= toMin(config.fecha);
    m += config.duracao
  ) {
    h.push(toHora(m));
  }
  return h;
}

function removerOcupados(
  base: string[],
  intervalos: Intervalo[],
  passo: number
) {
  const set = new Set(
    intervalos.flatMap(({ inicio, fim }) => {
      const a = toMin(inicio);
      const b = toMin(fim);
      const r: string[] = [];
      for (let m = a; m < b; m += passo) r.push(toHora(m));
      return r;
    })
  );
  return base.filter((h) => !set.has(h));
}

/* ================= ROTAS ================= */

function horariosRoute(app: Express) {
  app.get("/api/horarios", async (req: Request, res: Response) => {
   const data = String(req.query.data);
const barbeiro_id = String(req.query.barbeiro_id);

if (!data || !barbeiro_id) {
  return res.status(400).json({ erro: "faltando parametros" });
}

    try {
      const config = await carregarConfigAgenda(barbeiro_id, data);
      const ag = await carregarAgendamentos(data, barbeiro_id);
      const bl = await carregarBloqueios(data, barbeiro_id);

      const base = gerarHorarios(config);
      const livres = removerOcupados(
        removerOcupados(base, ag, config.duracao),
        bl,
        config.duracao
      );

      return res.json(livres);
    } catch (e: any) {
      console.error("🔥 ERRO REAL HORARIOS:", e);

      return res.status(500).json({
        erro: e?.message,
        barbeiro_id,
        data,
      });
    }
  });
}

function agendarRoute(app: Express) {
  app.use(express.json());

  app.post("/api/agendar", async (req: Request, res: Response) => {
   console.log("BODY RECEBIDO:", req.body);

const parsed = novoAgendamentoSchema.safeParse(req.body);

if (!parsed.success) {
  console.log("ERRO VALIDACAO:", parsed.error);
  return res.status(400).json({
    erro: parsed.error,
  });
}

    const { data, hora, barbeiro_id, cliente, telefone, servico } = parsed.data;

    try {
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
          ${cliente},
          ${telefone},
          ${servico},
          ${data},
          ${inicio},
          ${fim},
          'pendente'
        )
      `;

      res.status(201).json({ status: "confirmado" });
    } catch (e: any) {
      res.status(500).json({
        mensagem: "Erro ao confirmar.",
        detalhe: e?.message,
      });
    }
  });
}

/* ================= EXPORT ================= */

export function registrarRotasDeAgenda(app: Express) {
  horariosRoute(app);
  agendarRoute(app);
}
