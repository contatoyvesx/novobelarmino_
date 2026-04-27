import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  LogOut,
  Phone,
  RefreshCcw,
  Scissors,
  User,
  XCircle,
} from "lucide-react";

import AgendaVisual from "@/components/AgendaVisual";

const API = import.meta.env.VITE_API_URL || "/api";

type Status = "pendente" | "confirmado" | "cancelado";

type Agendamento = {
  id: number;
  barbeiro_id?: number | string;
  cliente: string;
  telefone: string;
  servico: string;
  data: string;
  inicio: string;
  fim: string;
  status: Status;
  created_at?: string;
};

type Barbeiro = {
  id: string | number;
  nome: string;
};

function hojeISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function formatHora(hora: string) {
  return (hora || "").slice(0, 5);
}

function formatData(data: string) {
  if (!data) return "";
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

function getMensagem(payload: any) {
  if (!payload) return "Erro inesperado.";
  if (typeof payload === "string") return payload;
  return payload.mensagem || payload.erro || payload.message || "Erro inesperado.";
}

function AdminLogin({ onLogin }: { onLogin: (token: string) => void }) {
  const [token, setToken] = useState("");

  return (
    <main className="min-h-screen bg-[#120000] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
        <h1 className="text-3xl font-black mb-2">Painel Admin</h1>
        <p className="text-sm text-white/60 mb-5">
          Digite a senha para acessar os agendamentos.
        </p>

        <input
          type="password"
          placeholder="Senha de acesso"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && token.trim()) onLogin(token.trim());
          }}
          className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none mb-4"
        />

        <button
          onClick={() => token.trim() && onLogin(token.trim())}
          className="w-full rounded-2xl bg-amber-500 px-4 py-3 font-black text-black hover:bg-amber-400"
        >
          Entrar
        </button>
      </div>
    </main>
  );
}

export default function Admin() {
  const [token, setToken] = useState(localStorage.getItem("belarmino_admin_token") || "");
  const [data, setData] = useState(hojeISO());
  const [barbeiroId, setBarbeiroId] = useState(
    localStorage.getItem("belarmino_admin_barbeiro") || ""
  );

  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const [agenda, setAgenda] = useState<Agendamento[]>([]);
  const [pendentes, setPendentes] = useState<Agendamento[]>([]);

  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  function login(t: string) {
    localStorage.setItem("belarmino_admin_token", t);
    setToken(t);
  }

  const logout = useCallback(() => {
    localStorage.removeItem("belarmino_admin_token");
    localStorage.removeItem("belarmino_admin_barbeiro");
    setToken("");
    setBarbeiroId("");
    setAgenda([]);
    setPendentes([]);
  }, []);

  const headers = useMemo(
    () => ({
      "x-admin-token": token,
    }),
    [token]
  );

  const carregarBarbeiros = useCallback(async () => {
    if (!token) return;

    try {
      const res = await fetch(`${API}/admin/barbeiros`, { headers });

      const payload = await res.json().catch(() => ({}));

      if (res.status === 401) {
        logout();
        return;
      }

      if (!res.ok) throw new Error(getMensagem(payload));

      const lista = payload.barbeiros || [];
      setBarbeiros(lista);

      if (!barbeiroId && lista.length > 0) {
        const primeiro = String(lista[0].id);
        setBarbeiroId(primeiro);
        localStorage.setItem("belarmino_admin_barbeiro", primeiro);
      }
    } catch (e: any) {
      setErro(e.message || "Erro ao carregar barbeiros.");
    }
  }, [token, headers, logout, barbeiroId]);

  const carregarPendentes = useCallback(async () => {
    if (!token) return;

    try {
      const res = await fetch(`${API}/admin/pendentes`, { headers });
      const payload = await res.json().catch(() => ({}));

      if (res.status === 401) {
        logout();
        return;
      }

      if (!res.ok) {
        setPendentes([]);
        return;
      }

      const lista = Array.isArray(payload)
        ? payload
        : payload.pendentes || payload.agendamentos || [];

      setPendentes(lista);
    } catch {
      setPendentes([]);
    }
  }, [token, headers, logout]);

  const carregarAgenda = useCallback(async () => {
    if (!token || !barbeiroId) return;

    setLoading(true);
    setErro("");
    setSucesso("");

    try {
      const res = await fetch(
        `${API}/admin/agendamentos?data=${encodeURIComponent(
          data
        )}&barbeiro_id=${encodeURIComponent(String(barbeiroId))}`,
        { headers }
      );

      const payload = await res.json().catch(() => ({}));

      if (res.status === 401) {
        logout();
        return;
      }

      if (!res.ok) throw new Error(getMensagem(payload));

      setAgenda(payload.agendamentos || []);
      await carregarPendentes();
    } catch (e: any) {
      setErro(e.message || "Erro ao carregar agenda.");
      setAgenda([]);
    } finally {
      setLoading(false);
    }
  }, [token, barbeiroId, data, headers, logout, carregarPendentes]);

  async function atualizarStatus(id: number, status: Status) {
    setSavingId(id);
    setErro("");
    setSucesso("");

    const rotas = [
      `${API}/admin/agendamentos/${id}/status`,
      `${API}/admin/agendamentos/${id}`,
    ];

    try {
      let funcionou = false;
      let ultimaMensagem = "";

      for (const rota of rotas) {
        const res = await fetch(rota, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-admin-token": token,
          },
          body: JSON.stringify({ status }),
        });

        const payload = await res.json().catch(() => ({}));

        if (res.status === 401) {
          logout();
          return;
        }

        if (res.ok) {
          funcionou = true;
          break;
        }

        ultimaMensagem = getMensagem(payload);
      }

      if (!funcionou) throw new Error(ultimaMensagem || "Erro ao atualizar status.");

      setSucesso(
        status === "confirmado"
          ? "Agendamento confirmado."
          : "Agendamento cancelado."
      );

      await carregarAgenda();
      await carregarPendentes();
    } catch (e: any) {
      setErro(e.message || "Erro ao atualizar status.");
    } finally {
      setSavingId(null);
    }
  }

  useEffect(() => {
    if (!token) return;
    carregarBarbeiros();
    carregarPendentes();
  }, [token, carregarBarbeiros, carregarPendentes]);

  useEffect(() => {
    if (!token || !barbeiroId) return;
    carregarAgenda();
  }, [token, barbeiroId, data, carregarAgenda]);

  const agendaOrdenada = useMemo(
    () => [...agenda].sort((a, b) => a.inicio.localeCompare(b.inicio)),
    [agenda]
  );

  const pendentesOrdenados = useMemo(
    () =>
      [...pendentes].sort((a, b) => {
        if (a.data !== b.data) return a.data.localeCompare(b.data);
        return a.inicio.localeCompare(b.inicio);
      }),
    [pendentes]
  );

  const doDia = agendaOrdenada;
  const confirmados = doDia.filter((a) => a.status === "confirmado");
  const cancelados = doDia.filter((a) => a.status === "cancelado");

  if (!token) {
    return <AdminLogin onLogin={login} />;
  }

  return (
    <main className="min-h-screen bg-[#120000] text-white px-4 py-5">
      <div className="mx-auto max-w-7xl">
        <header className="mb-5 flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-black">Painel Admin</h1>
            <p className="text-sm text-white/60">
              Controle rápido dos agendamentos da barbearia.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none"
            />

            <select
              value={barbeiroId}
              onChange={(e) => {
                setBarbeiroId(e.target.value);
                localStorage.setItem("belarmino_admin_barbeiro", e.target.value);
              }}
              className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none"
            >
              <option value="">Selecione o barbeiro</option>
              {barbeiros.map((b) => (
                <option key={String(b.id)} value={String(b.id)}>
                  {b.nome}
                </option>
              ))}
            </select>

            <button
              onClick={carregarAgenda}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 font-bold disabled:opacity-50"
            >
              <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
              Atualizar
            </button>

            <button
              onClick={logout}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 font-bold text-red-300"
            >
              <LogOut size={16} />
              Sair
            </button>
          </div>
        </header>

        {erro && (
          <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {erro}
          </div>
        )}

        {sucesso && (
          <div className="mb-4 rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-300">
            {sucesso}
          </div>
        )}

        <section className="mb-5 grid gap-4 md:grid-cols-4">
          <Card titulo="Pendentes gerais" valor={pendentesOrdenados.length} tipo="pendente" />
          <Card titulo="Agenda do dia" valor={doDia.length} tipo="normal" />
          <Card titulo="Confirmados" valor={confirmados.length} tipo="confirmado" />
          <Card titulo="Cancelados" valor={cancelados.length} tipo="cancelado" />
        </section>

        <section className="mb-5 rounded-3xl border border-amber-500/20 bg-amber-500/[0.07] p-5">
          <div className="mb-4 flex items-center gap-2">
            <Clock size={20} className="text-amber-300" />
            <h2 className="text-2xl font-black">Pendências de agendamento</h2>
          </div>

          {pendentesOrdenados.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/60">
              Nenhum agendamento pendente.
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {pendentesOrdenados.map((p) => (
                <div
                  key={p.id}
                  className="rounded-2xl border border-white/10 bg-black/30 p-4"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-lg font-black">
                        <User size={17} />
                        {p.cliente}
                      </div>

                      <div className="mt-1 text-sm text-white/60">
                        {formatData(p.data)} às {formatHora(p.inicio)}
                      </div>
                    </div>

                    <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-black text-amber-300">
                      PENDENTE
                    </span>
                  </div>

                  <div className="grid gap-2 text-sm text-white/75">
                    <div className="flex items-center gap-2">
                      <Phone size={15} />
                      {p.telefone}
                    </div>

                    <div className="flex items-center gap-2">
                      <Scissors size={15} />
                      {p.servico}
                    </div>

                    {p.barbeiro_id && (
                      <div className="text-white/50">
                        Barbeiro ID: {String(p.barbeiro_id)}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => atualizarStatus(p.id, "confirmado")}
                      disabled={savingId === p.id}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm font-black text-green-300 disabled:opacity-50"
                    >
                      <CheckCircle2 size={16} />
                      Confirmar
                    </button>

                    <button
                      onClick={() => atualizarStatus(p.id, "cancelado")}
                      disabled={savingId === p.id}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-black text-red-300 disabled:opacity-50"
                    >
                      <XCircle size={16} />
                      Cancelar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <div className="mb-4 flex items-center gap-2">
            <CalendarDays size={20} />
            <h2 className="text-2xl font-black">Agenda visual do dia</h2>
          </div>

          <AgendaVisual
            agendamentos={agendaOrdenada}
            onConfirmar={(id) => atualizarStatus(id, "confirmado")}
            onCancelar={(id) => atualizarStatus(id, "cancelado")}
          />
        </section>
      </div>
    </main>
  );
}

function Card({
  titulo,
  valor,
  tipo,
}: {
  titulo: string;
  valor: number;
  tipo: "pendente" | "confirmado" | "cancelado" | "normal";
}) {
  const cor =
    tipo === "pendente"
      ? "border-amber-500/20 bg-amber-500/10 text-amber-300"
      : tipo === "confirmado"
        ? "border-green-500/20 bg-green-500/10 text-green-300"
        : tipo === "cancelado"
          ? "border-red-500/20 bg-red-500/10 text-red-300"
          : "border-white/10 bg-white/[0.04] text-white";

  return (
    <div className={`rounded-3xl border p-5 ${cor}`}>
      <div className="text-sm font-bold opacity-80">{titulo}</div>
      <div className="mt-2 text-4xl font-black">{valor}</div>
    </div>
  );
}
