// (arquivo completo já corrigido — sem cortes)

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

// ====== utils ======

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

// ====== types ======

type Barbeiro = {
  id: string;
  nome: string;
  foto: string;
};

type MeuAgendamento = {
  id: number;
  data: string;
  inicio: string;
  servico: string;
  status: string;
};

// ====== helpers ======

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
  if (limpo.length <= 10)
    return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 6)}-${limpo.slice(6)}`;
  return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 7)}-${limpo.slice(7)}`;
}

// ====== component ======

export default function Agendar() {
  const API_URL = import.meta.env.VITE_API_URL || "/api";
  const dataHoje = useMemo(() => formatDateApi(new Date()), []);

  const [view, setView] = useState<"agendar" | "meus">("agendar");

  const [etapa, setEtapa] = useState(1);

  const [selectedDate, setSelectedDate] = useState(dataHoje);
  const [selectedBarbeiroId, setSelectedBarbeiroId] = useState("");
  const [selectedHora, setSelectedHora] = useState("");

  const [horarios, setHorarios] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const [cliente, setCliente] = useState("");
  const [telefone, setTelefone] = useState("");
  const [servicosSelecionados, setServicosSelecionados] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [mensagemErro, setMensagemErro] = useState("");

  const [user, setUser] = useState<User | null>(null);

  const [meusAgendamentos, setMeusAgendamentos] = useState<MeuAgendamento[]>([]);
  const [loadingMeus, setLoadingMeus] = useState(false);

  const barbeiros: Barbeiro[] = [
    { id: "1", nome: "Pedro", foto: "/barbeiros/pedro.jpg" },
    { id: "2", nome: "Marcelo", foto: "/barbeiros/marcelo.jpg" },
    { id: "3", nome: "Guilherme", foto: "/barbeiros/guilherme.jpg" },
  ];

  const servicos = ["Corte", "Barba", "Sobrancelha"];

  // ===== auth =====

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u?.displayName) setCliente(u.displayName);
    });
  }, []);

  // ===== horarios =====

  const buscarHorarios = useCallback(async () => {
    if (!selectedBarbeiroId) return;

    setLoading(true);

    try {
      const res = await fetch(
        `${API_URL}/horarios?data=${selectedDate}&barbeiro_id=${selectedBarbeiroId}`
      );

      const data = await res.json();
      setHorarios(data);
    } catch {
      setMensagemErro("Erro ao buscar horários.");
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedBarbeiroId]);

  useEffect(() => {
    buscarHorarios();
  }, [buscarHorarios]);

  // ===== meus =====

  async function carregarMeus() {
    if (!user) return;

    setLoadingMeus(true);

    try {
      const token = await user.getIdToken();

      const res = await fetch(`${API_URL}/meus-agendamentos`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setMeusAgendamentos(data);
    } catch {
      setMensagemErro("Erro ao buscar agendamentos.");
    } finally {
      setLoadingMeus(false);
    }
  }

  // ===== agendar =====

  async function confirmarAgendamento() {
    if (!user) return;

    setSubmitting(true);

    try {
      const token = await user.getIdToken();

      await fetch(`${API_URL}/agendar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cliente,
          telefone: telefone.replace(/\D/g, ""),
          servico: servicosSelecionados.join(", "),
          data: selectedDate,
          hora: selectedHora,
          barbeiro_id: selectedBarbeiroId,
        }),
      });

      setView("meus");
      carregarMeus();
    } catch {
      setMensagemErro("Erro ao agendar.");
    } finally {
      setSubmitting(false);
    }
  }

  // ===== UI =====

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <button
          onClick={() =>
            signInWithPopup(auth, new GoogleAuthProvider())
          }
        >
          Entrar com Google
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-xl mx-auto space-y-4">
      {/* NAV */}
      <div className="flex gap-2">
        <button onClick={() => setView("agendar")}>Agendar</button>
        <button
          onClick={() => {
            setView("meus");
            carregarMeus();
          }}
        >
          Meus Agendamentos
        </button>
      </div>

      {/* AGENDAR */}
      {view === "agendar" && (
        <div>
          {etapa === 1 && (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          )}

          {etapa === 2 && (
            <div>
              {barbeiros.map((b) => (
                <button key={b.id} onClick={() => setSelectedBarbeiroId(b.id)}>
                  {b.nome}
                </button>
              ))}

              {horarios.map((h) => (
                <button key={h} onClick={() => setSelectedHora(h)}>
                  {h}
                </button>
              ))}
            </div>
          )}

          {etapa === 3 && (
            <div>
              {servicos.map((s) => (
                <label key={s}>
                  <Checkbox
                    onCheckedChange={() =>
                      setServicosSelecionados((prev) =>
                        prev.includes(s)
                          ? prev.filter((x) => x !== s)
                          : [...prev, s]
                      )
                    }
                  />
                  {s}
                </label>
              ))}

              <input
                value={telefone}
                onChange={(e) =>
                  setTelefone(formatarTelefone(e.target.value))
                }
              />

              <button onClick={confirmarAgendamento}>
                Confirmar
              </button>
            </div>
          )}
        </div>
      )}

      {/* MEUS */}
      {view === "meus" && (
        <div>
          {loadingMeus ? (
            <p>Carregando...</p>
          ) : meusAgendamentos.length === 0 ? (
            <p>Nenhum agendamento</p>
          ) : (
            meusAgendamentos.map((a) => (
              <div key={a.id}>
                <p>{formatDatePtBr(new Date(a.data))}</p>
                <p>{a.inicio}</p>
                <p>{a.servico}</p>
                <p>{a.status}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
