import { z } from "zod";

export const dataSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return (
      !Number.isNaN(date.getTime()) &&
      value === date.toISOString().slice(0, 10)
    );
  }, "Data deve estar no formato YYYY-MM-DD e ser válida.");

export const horaSchema = z
  .string()
  .regex(/^\d{2}:\d{2}$/)
  .refine((value) => {
    const [hora, minuto] = value.split(":").map(Number);
    return (
      Number.isInteger(hora) &&
      Number.isInteger(minuto) &&
      hora >= 0 &&
      hora < 24 &&
      minuto >= 0 &&
      minuto < 60
    );
  }, "Hora deve estar no formato HH:MM.");

export const barbeiroIdSchema = z.coerce
  .number()
  .int("barbeiro_id inválido.")
  .positive("barbeiro_id inválido.");


// 🔥 TELEFONE VALIDADO DE VERDADE (BR)
export const telefoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/\D/g, "")) // remove tudo que não é número
  .refine((v) => v.length === 10 || v.length === 11, {
    message: "Telefone inválido. Use DDD + número.",
  })
  .refine((v) => {
    const ddd = Number(v.slice(0, 2));
    return ddd >= 11 && ddd <= 99;
  }, "DDD inválido.")
  .refine((v) => {
    // celular BR precisa ter 9 após DDD
    if (v.length === 11) return v[2] === "9";
    return true;
  }, "Celular inválido. Use formato com 9 dígitos.");


export const horariosQuerySchema = z.object({
  data: dataSchema,
  barbeiro_id: barbeiroIdSchema,
});


export const novoAgendamentoSchema = z.object({
  cliente: z.string().trim().min(1, "cliente é obrigatório"),
  telefone: telefoneSchema,
  servico: z.string().trim().min(1, "serviço é obrigatório"),
  data: dataSchema,
  hora: horaSchema,
  barbeiro_id: barbeiroIdSchema,
});
