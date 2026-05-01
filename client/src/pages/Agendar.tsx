import { useEffect, useState } from "react";
import { Link } from "wouter";
import { auth, provider } from "@/lib/firebase";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from "firebase/auth";

export default function Agendar() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [step, setStep] = useState<"login" | "form">("login");

  const [telefone, setTelefone] = useState("");
  const [servico, setServico] = useState("Corte");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  async function login() {
    try {
      await signInWithPopup(auth, provider);
    } catch {
      alert("Erro ao fazer login com Google.");
    }
  }

  async function logout() {
    await signOut(auth);
    setStep("login");
  }

  async function agendar() {
    if (!user) return;

    if (!telefone || !servico || !data || !hora) {
      alert("Preencha todos os campos.");
      return;
    }

    try {
      setSending(true);

      const token = await user.getIdToken();

      const response = await fetch("/api/agendar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          barbeiro_id: 1,
          data,
          hora,
          telefone,
          servico,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.mensagem || "Erro ao agendar.");
      }

      alert("Agendamento confirmado.");
    } catch (e: any) {
      alert(e?.message || "Erro ao agendar.");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#140000] text-[#E8C8A3]">
        Carregando...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#140000] text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-[#1b0503] to-[#140000]" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#D9A66A]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#6e2317]/40 rounded-full blur-3xl" />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg">
          <Link
            href="/"
            className="inline-flex mb-6 text-sm text-[#E8C8A3] hover:text-[#D9A66A]"
          >
            ← Voltar para o site
          </Link>

          <div className="rounded-[2rem] border border-[#D9A66A]/30 bg-[#2a0906]/90 backdrop-blur-xl shadow-2xl overflow-hidden">
            <div className="bg-black/30 px-7 py-8 border-b border-[#D9A66A]/20 text-center">
              <img
                src="/belarmino-logo.png"
                alt="Belarmino Barbershop"
                className="h-28 mx-auto object-contain drop-shadow-[0_0_24px_rgba(217,166,106,0.45)]"
              />

              <p className="mt-5 text-xs uppercase tracking-[0.35em] text-[#D9A66A]">
                Agendamento Online
              </p>

              <h1
                className="text-3xl font-bold mt-3"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {user ? "Escolha seu horário" : "Entre para agendar"}
              </h1>

              <p className="text-sm text-[#E8C8A3]/75 mt-3 leading-relaxed">
                {user
                  ? "Preencha os dados abaixo para confirmar seu agendamento."
                  : "Use sua conta Google para continuar com segurança."}
              </p>
            </div>

            <div className="p-7">
              {!user ? (
                <div className="space-y-5">
                  <button
                    onClick={login}
                    className="w-full flex items-center justify-center gap-3 bg-white text-black py-4 rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition shadow-lg"
                  >
                    <img
                      src="https://www.svgrepo.com/show/475656/google-color.svg"
                      alt="Google"
                      className="h-5 w-5"
                    />
                    Continuar com Google
                  </button>

                  <p className="text-xs text-center text-[#E8C8A3]/50">
                    Seu nome será usado apenas para identificar o agendamento.
                  </p>
                </div>
              ) : step === "login" ? (
                <div className="space-y-5">
                  <div className="flex items-center gap-3 rounded-2xl border border-[#D9A66A]/20 bg-black/25 p-4">
                    {user.photoURL && (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || "Usuário"}
                        className="w-12 h-12 rounded-full"
                      />
                    )}

                    <div className="min-w-0">
                      <p className="font-semibold text-white truncate">
                        Logado como {user.displayName || "Cliente"}
                      </p>
                      <p className="text-xs text-[#E8C8A3]/70 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setStep("form")}
                    className="w-full bg-[#D9A66A] text-[#140000] py-4 rounded-2xl font-bold hover:bg-[#E8C8A3] transition shadow-lg"
                  >
                    Prosseguir para agendamento
                  </button>

                  <button
                    onClick={logout}
                    className="w-full text-sm text-red-300 hover:text-red-200 transition"
                  >
                    Sair da conta Google
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <input
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="Telefone / WhatsApp"
                    className="w-full rounded-xl bg-black/30 border border-[#D9A66A]/20 px-4 py-3 text-white outline-none"
                  />

                  <select
                    value={servico}
                    onChange={(e) => setServico(e.target.value)}
                    className="w-full rounded-xl bg-black/30 border border-[#D9A66A]/20 px-4 py-3 text-white outline-none"
                  >
                    <option value="Corte">Corte</option>
                    <option value="Barba">Barba</option>
                    <option value="Corte + Barba">Corte + Barba</option>
                  </select>

                  <input
                    type="date"
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    className="w-full rounded-xl bg-black/30 border border-[#D9A66A]/20 px-4 py-3 text-white outline-none"
                  />

                  <input
                    type="time"
                    value={hora}
                    onChange={(e) => setHora(e.target.value)}
                    className="w-full rounded-xl bg-black/30 border border-[#D9A66A]/20 px-4 py-3 text-white outline-none"
                  />

                  <button
                    onClick={agendar}
                    disabled={sending}
                    className="w-full bg-[#D9A66A] text-[#140000] py-4 rounded-2xl font-bold hover:bg-[#E8C8A3] disabled:opacity-60 transition shadow-lg"
                  >
                    {sending ? "Confirmando..." : "Confirmar horário"}
                  </button>

                  <button
                    onClick={() => setStep("login")}
                    className="w-full text-sm text-[#E8C8A3]/70 hover:text-white transition"
                  >
                    Voltar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
