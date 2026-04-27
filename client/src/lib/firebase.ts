import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB56kLqcifpX6HxvkAbJOizhqyqhqB-lJw",
  authDomain: "belarmino-3823b.firebaseapp.com",
  projectId: "belarmino-3823b",
  appId: "1:207578359392:web:2cefdb265a0bd75b8cc505",
};

const app = initializeApp(firebaseConfig);

// 🔴 ISSO QUE FALTAVA
export const auth = getAuth(app);
