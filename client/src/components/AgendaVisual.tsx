import React from "react";

type Status = "confirmado" | "cancelado";

type Agendamento = {
  id: number;
  cliente: string;
  telefone: string;
  servico: string;
  inicio: string;
  fim: string;
  status: Status;
};

type Props = {
  agendamentos: Agendamento[];
  onCancelar?: (id: number) => void;
};

const hhmm = (t: string) => t.slice(0, 5);

function statusColor(status: Status) {
  if (status === "confirmado") return "#22c55e";
  return "#ef4444";
}

function statusBg(status: Status) {
  if (status === "confirmado") return "rgba(34,197,94,.15)";
  return "rgba(239,68,68,.15)";
}

// Slots 30min
function gerarSlots() {
  const slots: string[] = [];
  for (let h = 9; h < 18; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
    slots.push(`${String(h).padStart(2, "0")}:30`);
  }
  return slots;
}

const statusLabel = (status: Status) =>
  status === "confirmado" ? "Confirmado" : "Cancelado";

export default function AgendaVisual({ agendamentos, onCancelar }: Props) {
  const slots = gerarSlots();

  const mapa = new Map<string, Agendamento>();
  agendamentos.forEach((a) => {
    mapa.set(hhmm(a.inicio), a);
  });

  return (
    <div
      style={{
        marginTop: 20,
        border: "1px solid rgba(255,255,255,.12)",
        borderRadius: 16,
        overflow: "hidden",
        background: "linear-gradient(180deg, rgba(15,23,42,.85), rgba(15,23,42,.5))",
      }}
    >
      <div
        style={{
          padding: "14px 18px",
          borderBottom: "1px solid rgba(255,255,255,.12)",
          fontWeight: 900,
        }}
      >
        Agenda do dia
      </div>

      {slots.map((hora) => {
        const a = mapa.get(hora);

        return (
          <div
            key={hora}
            style={{
              display: "grid",
              gridTemplateColumns: "90px 1fr",
              borderBottom: "1px solid rgba(255,255,255,.06)",
              background: a ? statusBg(a.status) : "rgba(255,255,255,.02)",
              minHeight: 60,
            }}
          >
            <div
              style={{
                padding: "12px",
                fontWeight: 900,
                borderRight: "1px solid rgba(255,255,255,.08)",
              }}
            >
              {hora}
            </div>

            <div style={{ padding: "10px" }}>
              {a ? (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontWeight: 900 }}>{a.cliente}</div>
                    <div style={{ fontSize: 12 }}>{a.servico}</div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>{a.telefone}</div>
                  </div>

                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 800,
                        color: statusColor(a.status),
                      }}
                    >
                      {statusLabel(a.status)}
                    </span>

                    {a.status !== "cancelado" && onCancelar && (
                      <button
                        onClick={() => onCancelar(a.id)}
                        style={{
                          padding: "6px 10px",
                          borderRadius: 8,
                          border: "1px solid #ef444455",
                          color: "#ef4444",
                          background: "transparent",
                          fontWeight: 800,
                          cursor: "pointer",
                        }}
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <span style={{ opacity: 0.5 }}>Livre</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
