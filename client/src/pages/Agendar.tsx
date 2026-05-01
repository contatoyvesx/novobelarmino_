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
  }

  async function agendar() {
    if (!user) return;

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
          data: "2026-05-10",
          hora: "10:00",
          telefone: "11999999999",
          servico: "Corte",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.mensagem || "Erro ao agendar.");
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
      <div className="absolute -top-32 -right-24 w-96 h-96 bg-[#D9A66A]/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -left-24 w-96 h-96 bg-[#6e2317]/30 rounded-full blur-3xl" />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="inline-flex mb-6 text-sm text-[#E8C8A3] hover:text-[#D9A66A]"
          >
            ← Voltar para o site
          </Link>

          <div className="rounded-3xl border border-[#D9A66A]/30 bg-[#2a0906]/80 backdrop-blur-xl shadow-2xl p-7">
            <div className="flex flex-col items-center text-center mb-7">
              <img
                src="/belarmino-logo.png"
                alt="Belarmino Barbershop"
                className="h-24 object-contain mb-4 drop-shadow-[0_0_20px_rgba(217,166,106,0.35)]"
              />

              <span className="text-xs uppercase tracking-[0.3em] text-[#D9A66A]">
                Agendamento Online
              </span>

              <h1
                className="text-3xl font-bold text-white mt-3"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Reserve seu horário
              </h1>

              <p className="text-sm text-[#E8C8A3]/80 mt-3 leading-relaxed">
                Entre com sua conta Google para confirmar seu agendamento com segurança.
              </p>
            </div>

            {!user ? (
              <div className="space-y-5">
                <div className="rounded-2xl border border-[#D9A66A]/20 bg-black/25 p-4">
                  <p className="text-sm text-[#E8C8A3]">
                    Seu nome será usado automaticamente no agendamento.
                  </p>
                </div>

                <button
                  onClick={login}
                  className="w-full flex items-center justify-center gap-3 bg-white text-black py-4 rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition shadow-lg"
                >
                  <img
                    src="https://www.svgrepo.com/show/475656/google-color.svg"
                    alt="Google"
                    className="h-5 w-5"
                  />
                  Entrar com Google
                </button>
              </div>
            ) : (
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
                      {user.displayName || "Usuário logado"}
                    </p>
                    <p className="text-xs text-[#E8C8A3]/70 truncate">
                      {user.email}
                    </p>
                  </div>
                </div>

                <button
                  onClick={agendar}
                  disabled={sending}
                  className="w-full bg-[#D9A66A] text-[#140000] py-4 rounded-2xl font-bold hover:bg-[#E8C8A3] disabled:opacity-60 transition shadow-lg"
                >
                  {sending ? "Confirmando..." : "Confirmar Agendamento"}
                </button>

                <button
                  onClick={logout}
                  className="w-full text-sm text-[#E8C8A3]/70 hover:text-white transition"
                >
                  Sair da conta
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
