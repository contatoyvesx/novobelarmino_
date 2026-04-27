import { useCallback, useEffect, useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

function getMensagemErro(payload: any) {
  if (!payload) return "Erro inesperado.";
  if (typeof payload === "string") return payload;

  if (typeof payload?.mensagem === "string") return payload.mensagem;
  if (typeof payload?.erro === "string") return payload.erro;
  if (typeof payload?.message === "string") return payload.message;

  if (Array.isArray(payload?.errors)) {
    return payload.errors.map((e: any) => e.message || e).join(", ");
  }

  if (Array.isArray(payload?.issues)) {
    return payload.issues.map((e: any) => e.message || e).join(", ");
  }

  return JSON.stringify(payload);
}

const formatDatePtBr = (date: Date) =>
  date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const formatDateApi = (date: Date) => date.toISOString().slice(0, 10);

type Barbeiro = {
  id: string;
  nome: string;
};

export default function Agendar() {
  const dataHoje = useMemo(() => formatDateApi(new Date()), []);
  const [selectedDate, setSelectedDate] = useState<string>(dataHoje);

  const [barbeiros] = useState<Barbeiro[]>([
    { id: "1", nome: "Pedro" },
    { id: "2", nome: "Marcelo" },
    { id: "3", nome: "Guilherme" },
  ]);

  const [selectedBarbeiroId, setSelectedBarbeiroId] = useState<string>("");

  const [horarios, setHorarios] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [jaBuscou, setJaBuscou] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [selectedHora, setSelectedHora] = useState("");
  const [cliente, setCliente] = useState("");
  const [telefone, setTelefone] = useState("");
  const [servicosSelecionados, setServicosSelecionados] = useState<string[]>([]);
  const [mensagemErro, setMensagemErro] = useState("");
  const [mensagemSucesso, setMensagemSucesso] = useState("");

  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || "/api";

  const servicos = useMemo(
    () => [
      "Corte de cabelo",
      "Barba",
      "Sobrancelha",
      "Hidratação capilar",
      "Limpeza de pele / black mask",
      "Camuflagem de fios brancos",
    ],
    []
  );

  const dataParaExibicao = useMemo(() => {
    const parsed = new Date(selectedDate + "T00:00:00");
    return Number.isNaN(parsed.getTime()) ? "" : formatDatePtBr(parsed);
  }, [selectedDate]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoadingUser(false);

      if (u?.displayName) {
        setCliente((prev) => prev || u.displayName || "");
      }
    });

    return () => unsubscribe();
  }, []);

  const toggleServico = (servico: string) => {
    setServicosSelecionados((prev) =>
      prev.includes(servico)
        ? prev.filter((s) => s !== servico)
        : [...prev, servico]
    );
  };

  const servicosFormatados = servicosSelecionados.join(", ");

  const buscarHorarios = useCallback(
    async (data: string, barbeiroId: string) => {
      if (!data || !barbeiroId) return;

      setLoading(true);
      setMensagemErro("");
      setMensagemSucesso("");
      setSelectedHora("");
      setHorarios([]);

      try {
        const url =
          API_URL +
          "/horarios?data=" +
          encodeURIComponent(data) +
          "&barbeiro_id=" +
          encodeURIComponent(barbeiroId);

        const res = await fetch(url, { cache: "no-store" });

        const contentType = res.headers.get("content-type") || "";

        const payload = contentType.includes("application/json")
          ? await res.json()
          : await res.text();

        if (!res.ok) {
          setMensagemErro(getMensagemErro(payload));
          setHorarios([]);
          return;
        }

        const lista = Array.isArray(payload) ? payload : [];
        setHorarios(lista);
      } catch {
        setMensagemErro("Erro ao buscar horários.");
      } finally {
        setLoading(false);
        setJaBuscou(true);
      }
    },
    [API_URL]
  );

  useEffect(() => {
    if (!user || !selectedBarbeiroId) return;
    void buscarHorarios(selectedDate, selectedBarbeiroId);
  }, [buscarHorarios, selectedDate, selectedBarbeiroId, user]);

  async function login() {
    try {
      setMensagemErro("");
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error("ERRO FIREBASE:", err);
      setMensagemErro(err?.code || "Erro ao entrar com Google.");
    }
  }

  async function confirmarAgendamento() {
    if (!user) {
      setMensagemErro("Faça login com Google para continuar.");
      return;
    }

    if (!selectedBarbeiroId) {
      setMensagemErro("Selecione um barbeiro.");
      return;
    }

    if (!cliente || !telefone || !servicosSelecionados.length || !selectedHora) {
      setMensagemErro("Preencha todos os campos.");
      return;
    }

    setSubmitting(true);
    setMensagemErro("");
    setMensagemSucesso("");

    try {
      const res = await fetch(API_URL + "/agendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente,
          telefone,
          servico: servicosFormatados,
          data: selectedDate,
          hora: selectedHora,
          barbeiro_id: selectedBarbeiroId,
        }),
      });

      const contentType = res.headers.get("content-type") || "";

      const payload = contentType.includes("application/json")
        ? await res.json()
        : await res.text();

      if (!res.ok) {
        setMensagemErro(getMensagemErro(payload));
        return;
      }

      setMensagemSucesso("Agendamento enviado com sucesso!");

      setTelefone("");
      setServicosSelecionados([]);
      setSelectedHora("");

      void buscarHorarios(selectedDate, selectedBarbeiroId);
    } catch {
      setMensagemErro("Erro ao enviar agendamento.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-[#140000] text-white p-4 flex items-center justify-center">
        Carregando...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#140000] text-white p-4 flex items-center justify-center">
        <div className="max-w-md w-full rounded-2xl border border-[#6e2317] bg-[#1b0402] p-6 text-center space-y-4">
          <h1 className="text-3xl font-bold text-[#D9A66A]">
            Agendar Horário
          </h1>

          <p className="text-sm text-[#E8C8A3]">
            Entre com sua conta Google para continuar.
          </p>

          {mensagemErro && (
            <p className="text-red-400 text-center">{mensagemErro}</p>
          )}

          <button
            onClick={login}
            className="w-full rounded-xl bg-[#D9A66A] text-black font-semibold py-3 px-4"
          >
            Entrar com Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#140000] text-white p-4">
      <div className="max-w-xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold text-center text-[#D9A66A]">
          Agendar Horário
        </h1>

        <p className="text-center text-sm text-[#E8C8A3]">
          Logado como: {user.displayName || user.email}
        </p>

        <select
          value={selectedBarbeiroId}
          onChange={(e) => setSelectedBarbeiroId(e.target.value)}
          className="w-full p-3 rounded bg-[#1b0402] border border-[#6e2317]"
        >
          <option value="">Selecione um barbeiro</option>
          {barbeiros.map((barbeiro) => (
            <option key={barbeiro.id} value={barbeiro.id}>
              {barbeiro.nome}
            </option>
          ))}
        </select>

        <input
          type="date"
          min={dataHoje}
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full p-3 rounded bg-[#1b0402] border border-[#6e2317]"
        />

        <p className="text-xs text-[#E8C8A3]">
          Data selecionada: {dataParaExibicao}
        </p>

        <div className="space-y-3">
          <p className="text-[#D9A66A] font-semibold">Horários disponíveis</p>

          {loading && (
            <p className="text-gray-300 text-sm">Carregando horários…</p>
          )}

          {!loading && jaBuscou && horarios.length === 0 && (
            <p className="text-gray-400 text-sm">
              Nenhum horário disponível para esta data.
            </p>
          )}

          {!loading && horarios.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {horarios.map((h) => (
                <button
                  key={h}
                  onClick={() => setSelectedHora(h)}
                  className={
                    "px-4 py-2 rounded-full border " +
                    (selectedHora === h
                      ? "bg-[#D9A66A] text-black"
                      : "bg-[#1b0402] border-[#6e2317] text-[#E8C8A3]")
                  }
                >
                  {h}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {servicos.map((servico) => {
            const selecionado = servicosSelecionados.includes(servico);

            return (
              <label
                key={servico}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-3 cursor-pointer",
                  selecionado
                    ? "border-[#D9A66A] bg-[#26100d]"
                    : "border-[#6e2317] bg-[#1b0402]"
                )}
              >
                <Checkbox
                  checked={selecionado}
                  onCheckedChange={() => toggleServico(servico)}
                />
                <span>{servico}</span>
              </label>
            );
          })}
        </div>

        <input
          type="text"
          placeholder="Seu nome"
          value={cliente}
          onChange={(e) => setCliente(e.target.value)}
          className="w-full p-3 rounded bg-[#1b0402] border border-[#6e2317]"
        />

        <input
          type="tel"
          placeholder="Telefone com DDD"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          className="w-full p-3 rounded bg-[#1b0402] border border-[#6e2317]"
        />

        {mensagemErro && (
          <p className="text-red-400 text-center">{mensagemErro}</p>
        )}

        {mensagemSucesso && (
          <p className="text-green-400 text-center">{mensagemSucesso}</p>
        )}

        <button
          onClick={confirmarAgendamento}
          disabled={loading || submitting}
          className="btn-retro w-full"
        >
          {submitting ? "Enviando…" : "Confirmar Agendamento"}
        </button>
      </div>
    </div>
  );
}
