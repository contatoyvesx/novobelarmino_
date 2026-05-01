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
  foto: string;
};

function telefoneValido(tel: string) {
  const limpo = tel.replace(/\D/g, "");

  if (limpo.length !== 10 && limpo.length !== 11) return false;

  const ddd = Number(limpo.slice(0, 2));
  if (ddd < 11 || ddd > 99) return false;

  if (limpo.length === 11 && limpo[2] !== "9") return false;

  return true;
}

function formatarTelefone(valor: string) {
  const limpo = valor.replace(/\D/g, "").slice(0, 11);

  if (limpo.length <= 2) return limpo;
  if (limpo.length <= 6) return `(${limpo.slice(0, 2)}) ${limpo.slice(2)}`;
  if (limpo.length <= 10) {
    return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 6)}-${limpo.slice(6)}`;
  }

  return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 7)}-${limpo.slice(7)}`;
}

export default function Agendar() {
  const dataHoje = useMemo(() => formatDateApi(new Date()), []);
  const API_URL = import.meta.env.VITE_API_URL || "/api";

  const [etapa, setEtapa] = useState(1);

  const [selectedDate, setSelectedDate] = useState<string>(dataHoje);
  const [selectedBarbeiroId, setSelectedBarbeiroId] = useState<string>("");
  const [selectedHora, setSelectedHora] = useState("");

  const [horarios, setHorarios] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [jaBuscou, setJaBuscou] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [cliente, setCliente] = useState("");
  const [telefone, setTelefone] = useState("");
  const [servicosSelecionados, setServicosSelecionados] = useState<string[]>([]);

  const [mensagemErro, setMensagemErro] = useState("");
  const [mensagemSucesso, setMensagemSucesso] = useState("");

  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const barbeiros: Barbeiro[] = [
    { id: "1", nome: "Pedro", foto: "/barbeiros/pedro.jpg" },
    { id: "2", nome: "Marcelo", foto: "/barbeiros/marcelo.jpg" },
    { id: "3", nome: "Guilherme", foto: "/barbeiros/guilherme.jpg" },
  ];

  const servicos = [
    "Corte de cabelo",
    "Barba",
    "Sobrancelha",
    "Hidratação capilar",
    "Limpeza de pele / black mask",
    "Camuflagem de fios brancos",
  ];

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

        setHorarios(Array.isArray(payload) ? payload : []);
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
    if (!selectedBarbeiroId) return;
    void buscarHorarios(selectedDate, selectedBarbeiroId);
  }, [buscarHorarios, selectedDate, selectedBarbeiroId]);

  async function login() {
    try {
      setMensagemErro("");
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setMensagemErro(err?.code || "Erro ao entrar com Google.");
    }
  }

  function toggleServico(servico: string) {
    setServicosSelecionados((prev) =>
      prev.includes(servico)
        ? prev.filter((s) => s !== servico)
        : [...prev, servico]
    );
  }

  async function confirmarAgendamento() {
    if (!user) {
      setMensagemErro("Faça login com Google para continuar.");
      return;
    }

    if (!selectedDate || !selectedBarbeiroId || !selectedHora) {
      setMensagemErro("Escolha data, barbeiro e horário.");
      return;
    }

    if (!cliente.trim()) {
      setMensagemErro("Informe seu nome.");
      return;
    }

    if (!telefoneValido(telefone)) {
      setMensagemErro("Telefone inválido. Informe DDD + número correto.");
      return;
    }

    if (!servicosSelecionados.length) {
      setMensagemErro("Escolha pelo menos um serviço.");
      return;
    }

    setSubmitting(true);
    setMensagemErro("");
    setMensagemSucesso("");

    try {
      const token = await user.getIdToken();

      const res = await fetch(API_URL + "/agendar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cliente: cliente.trim(),
          telefone: telefone.replace(/\D/g, ""),
          servico: servicosSelecionados.join(", "),
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

      setMensagemSucesso(
        "Agendamento solicitado. A confirmação virá pelo WhatsApp."
      );

      setEtapa(1);
      setSelectedHora("");
      setSelectedBarbeiroId("");
      setTelefone("");
      setServicosSelecionados([]);
      setJaBuscou(false);
      setHorarios([]);
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
<img
  src="/belarmino-logo.png"
  alt="Belarmino Barber Shop"
  className="mx-auto h-24 object-contain"
/>

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
        <div className="text-center space-y-4 rounded-2xl border border-[#6e2317] bg-[#1b0402] p-6">
          <img
<img
  src="/belarmino-logo.png"
  alt="Belarmino Barber Shop"
  className="mx-auto h-24 object-contain"
/>

          <p className="text-xs tracking-[0.3em] text-[#D9A66A]">
            AGENDAMENTO ONLINE
          </p>

          <h1 className="text-3xl font-bold text-white">Escolha seu horário</h1>

          <p className="text-sm text-[#E8C8A3]">
            Preencha os dados abaixo para confirmar seu agendamento.
          </p>

          <p className="text-xs text-[#E8C8A3]">
            Logado como: {user.displayName || user.email}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className={cn(
                "rounded-full py-2 text-center text-sm font-bold border",
                etapa === n
                  ? "bg-[#D9A66A] text-black border-[#D9A66A]"
                  : "bg-[#1b0402] text-[#E8C8A3] border-[#6e2317]"
              )}
            >
              {n}
            </div>
          ))}
        </div>

        {mensagemErro && (
          <p className="text-red-400 text-center">{mensagemErro}</p>
        )}

        {mensagemSucesso && (
          <div className="rounded-xl border border-green-700 bg-green-950/40 p-4 text-green-300 text-center font-semibold">
            {mensagemSucesso}
          </div>
        )}

        {etapa === 1 && (
          <div className="space-y-4 rounded-2xl border border-[#6e2317] bg-[#1b0402] p-5">
            <h2 className="text-2xl font-bold text-[#D9A66A]">
              Escolha o dia
            </h2>

            <input
              type="date"
              min={dataHoje}
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setSelectedHora("");
                setHorarios([]);
                setJaBuscou(false);
              }}
              className="w-full p-3 rounded bg-[#140000] border border-[#6e2317]"
            />

            <p className="text-xs text-[#E8C8A3]">
              Data selecionada: {dataParaExibicao}
            </p>

            <button
              onClick={() => {
                setMensagemErro("");
                setEtapa(2);
              }}
              className="btn-retro w-full"
            >
              Próximo
            </button>
          </div>
        )}

        {etapa === 2 && (
          <div className="space-y-5 rounded-2xl border border-[#6e2317] bg-[#1b0402] p-5">
            <h2 className="text-2xl font-bold text-[#D9A66A]">
              Escolha o barbeiro e horário
            </h2>

            <div className="grid gap-3 sm:grid-cols-3">
              {barbeiros.map((barbeiro) => (
                <button
                  key={barbeiro.id}
                  onClick={() => {
                    setSelectedBarbeiroId(barbeiro.id);
                    setMensagemErro("");
                  }}
                  className={cn(
                    "rounded-xl border p-3 text-center space-y-2",
                    selectedBarbeiroId === barbeiro.id
                      ? "border-[#D9A66A] bg-[#26100d]"
                      : "border-[#6e2317] bg-[#140000]"
                  )}
                >
                  <img
                    src={barbeiro.foto}
                    alt={barbeiro.nome}
                    className="mx-auto h-20 w-20 rounded-full object-cover border border-[#D9A66A]/50"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />

                  <div className="font-bold">{barbeiro.nome}</div>
                </button>
              ))}
            </div>

            {selectedBarbeiroId && (
              <div className="space-y-3">
                <p className="text-[#D9A66A] font-semibold">
                  Horários disponíveis
                </p>

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
                            : "bg-[#140000] border-[#6e2317] text-[#E8C8A3]")
                        }
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setEtapa(1)}
                className="rounded-xl border border-[#6e2317] py-3 font-semibold"
              >
                Voltar
              </button>

              <button
                onClick={() => {
                  if (!selectedBarbeiroId) {
                    setMensagemErro("Selecione um barbeiro.");
                    return;
                  }

                  if (!selectedHora) {
                    setMensagemErro("Escolha um horário.");
                    return;
                  }

                  setMensagemErro("");
                  setEtapa(3);
                }}
                className="btn-retro w-full"
              >
                Próximo
              </button>
            </div>
          </div>
        )}

        {etapa === 3 && (
          <div className="space-y-5 rounded-2xl border border-[#6e2317] bg-[#1b0402] p-5">
            <h2 className="text-2xl font-bold text-[#D9A66A]">
              Serviço e contato
            </h2>

            <div className="rounded-xl border border-[#6e2317] bg-[#140000] p-3 text-sm text-[#E8C8A3]">
              {dataParaExibicao} às {selectedHora}
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
                        : "border-[#6e2317] bg-[#140000]"
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
              className="w-full p-3 rounded bg-[#140000] border border-[#6e2317]"
            />

            <input
              type="tel"
              placeholder="Telefone com DDD"
              value={telefone}
              onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
              className="w-full p-3 rounded bg-[#140000] border border-[#6e2317]"
            />

            <p className="text-xs text-[#E8C8A3]">
              Exemplo: (11) 94700-6358
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setEtapa(2)}
                className="rounded-xl border border-[#6e2317] py-3 font-semibold"
              >
                Voltar
              </button>

              <button
                onClick={confirmarAgendamento}
                disabled={loading || submitting}
                className="btn-retro w-full"
              >
                {submitting ? "Enviando…" : "Solicitar Agendamento"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
