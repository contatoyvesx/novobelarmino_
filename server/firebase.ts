import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: "belarmino-3823b",
      clientEmail: "COLOCA_AQUI_O_CLIENT_EMAIL",
      privateKey: "COLOCA_AQUI_A_PRIVATE_KEY".replace(/\\n/g, "\n"),
    }),
  });
}

export const auth = admin.auth();
