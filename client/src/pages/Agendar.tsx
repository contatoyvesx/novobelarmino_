import { useEffect, useState } from "react";
import { auth, provider } from "@/lib/firebase";
import {
  signInWithPopup,
  onAuthStateChanged,
  User,
} from "firebase/auth";

export default function Agendar() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
    } catch (e) {
      alert("Erro ao fazer login");
    }
  }

  async function agendar() {
    if (!user) return;

    try {
      const token = await user.getIdToken();

      await fetch("/api/agendar", {
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

      alert("Agendamento confirmado");
    } catch (e) {
      alert("Erro ao agendar");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white">
        Carregando...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white px-4">
      <div className="w-full max-w-md bg-neutral-900 rounded-2xl p-6 shadow-xl">

        {/* LOGO */}
        <div className="flex flex-col items-center mb-6">
          <img
            src="/belarmino-logo.png"
            className="h-20 object-contain mb-2"
          />
          <span className="text-sm text-neutral-400">
            Barbearia Belarmino
          </span>
        </div>

        {!user ? (
          <>
            <h2 className="text-xl font-semibold text-center mb-4">
              Agende seu horário
            </h2>

            <button
              onClick={login}
              className="w-full flex items-center justify-center gap-2 bg-white text-black py-3 rounded-xl font-semibold hover:opacity-90 transition"
            >
              <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                className="h-5"
              />
              Entrar com Google
            </button>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold mb-2 text-center">
              Bem-vindo, {user.displayName}
            </h2>

            <p className="text-sm text-center text-neutral-400 mb-4">
              {user.email}
            </p>

            <button
              onClick={agendar}
              className="w-full bg-green-500 py-3 rounded-xl font-semibold hover:opacity-90 transition"
            >
              Confirmar Agendamento
            </button>

            <button
              onClick={() => auth.signOut()}
              className="w-full mt-3 text-sm text-neutral-400 hover:text-white"
            >
              Trocar conta
            </button>
          </>
        )}
      </div>
    </div>
  );
}
