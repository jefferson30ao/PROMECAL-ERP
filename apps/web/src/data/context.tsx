import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Database } from "../../../../packages/domain/types";
import { repository } from "./repository";
interface Store {
  db: Database;
  commit: (next: Database) => Promise<void>;
  toast: (message: string) => void;
}
const Context = createContext<Store | null>(null);
export function DataProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<Database | null>(null),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  useEffect(() => {
    repository
      .load()
      .then(setDb)
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(""), 4500);
      return () => clearTimeout(t);
    }
  }, [message]);
  if (error)
    return (
      <main className="fatal">
        <h1>No se pudieron cargar los datos</h1>
        <p>{error}</p>
        <button onClick={() => location.reload()}>Volver a intentar</button>
      </main>
    );
  if (!db) return <main className="fatal">Cargando PROMECAL…</main>;
  const commit = async (next: Database) => {
    await repository.save(next);
    setDb(next);
  };
  return (
    <Context.Provider value={{ db, commit, toast: setMessage }}>
      {children}
      {message && (
        <div className="toast" role="status">
          {message}
        </div>
      )}
    </Context.Provider>
  );
}
export function useData() {
  const c = useContext(Context);
  if (!c) throw Error("DataProvider requerido");
  return c;
}
