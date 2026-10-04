import { useState } from "react";
import {
  HashRouter,
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  LayoutDashboard,
  Handshake,
  FlaskConical,
  Package,
  Wallet,
  ShieldCheck,
  CalendarDays,
  Settings,
  Search,
  Bell,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  Menu,
  ArrowUpRight,
  Command,
  BookOpen,
} from "lucide-react";
import { modules, resources } from "../../../packages/domain/catalog";
import { useData, DataProvider } from "./data/context";
import { Dashboard } from "./pages/Dashboard";
import { ResourcePage } from "./pages/ResourcePage";
import { OrderDetail } from "./pages/OrderDetail";
import { Planning, Activity, Receivables } from "./pages/Planning";
import { Settings as SettingsPage } from "./pages/Settings";
import { Modal } from "./components/ui";
const icons = [Handshake, FlaskConical, Package, Wallet, ShieldCheck];
function Shell() {
  const location = useLocation(),
    navigate = useNavigate(),
    { db } = useData();
  const [menu, setMenu] = useState(false),
    [query, setQuery] = useState(""),
    [search, setSearch] = useState(false),
    [profile, setProfile] = useState(false);
  const currentModule = modules.find((m) => location.pathname.includes(m.id)),
    resource = resources.find((r) => location.pathname.endsWith("/" + r.key));
  const results = query.trim()
    ? resources
        .flatMap((r) =>
          db.records[r.key]
            .filter((e) =>
              Object.values(e)
                .join(" ")
                .toLowerCase()
                .includes(query.toLowerCase()),
            )
            .slice(0, 3)
            .map((e) => ({ r, e })),
        )
        .slice(0, 15)
    : [];
  return (
    <div className="app-shell">
      <a
        className="skip-link"
        href="#main"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("main")?.focus();
        }}
      >
        Ir al contenido principal
      </a>
      {menu && (
        <button
          className="sidebar-overlay"
          aria-label="Cerrar el menú"
          onClick={() => setMenu(false)}
        />
      )}
      <aside className={`sidebar ${menu ? "open" : ""}`}>
        <Link className="brand" to="/" onClick={() => setMenu(false)}>
          <img
            src="/logo-promecal.png"
            alt="PROMECAL"
            className="brand-logo"
          />
        </Link>
        <div className="workspace-switch">
          <span className="workspace-icon">P</span>
          <div>
            <b>PROMECAL S.A.C.</b>
            <small>Espacio de trabajo</small>
          </div>
          <ChevronDown size={15} />
        </div>
        <div className="nav-caption">GENERAL</div>
        <nav aria-label="Navegación principal">
          <NavLink to="/" end onClick={() => setMenu(false)}>
            <LayoutDashboard size={18} />
            <span>Vista general</span>
          </NavLink>
          <NavLink to="/planificador" onClick={() => setMenu(false)}>
            <CalendarDays size={18} />
            <span>Planificador</span>
          </NavLink>
          <div className="nav-caption modules-caption">MÓDULOS DEL ERP</div>
          {modules.map((m, i) => {
            const Icon = icons[i];
            const active = currentModule?.id === m.id;
            return (
              <div key={m.id}>
                <NavLink
                  to={`/modulos/${m.id}`}
                  className={active ? "active" : ""}
                  onClick={() => setMenu(false)}
                >
                  <Icon size={18} />
                  <span>{m.short}</span>
                  <small>{m.code}</small>
                  <ChevronRight size={13} className={active ? "rotated" : ""} />
                </NavLink>
                {active && (
                  <div className="subnav">
                    {resources
                      .filter((r) => r.module === m.id)
                      .map((r) => (
                        <NavLink
                          key={r.key}
                          to={`/modulos/${m.id}/${r.key}`}
                          onClick={() => setMenu(false)}
                        >
                          {r.title}
                        </NavLink>
                      ))}
                    {m.id === "finanzas" && (
                      <NavLink
                        to="/cuentas-por-cobrar"
                        onClick={() => setMenu(false)}
                      >
                        Cuentas por cobrar
                      </NavLink>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="live-dot" />
            <b>Todo empieza con precisión.</b>
            <p>
              Una operación conectada,
              <br />
              de principio a fin.
            </p>
          </div>
          <NavLink to="/actividad">
            <Bell size={17} /> Centro de actividad
          </NavLink>
          <NavLink to="/configuracion">
            <Settings size={17} /> Configuración
          </NavLink>
          <div className="sidebar-version">
            <span>ERP PROMECAL</span>
            <span>v0.1</span>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumbs">
            <button
              className="icon-button mobile-menu"
              aria-label="Abrir menú"
              onClick={() => setMenu(!menu)}
            >
              <Menu size={20} />
            </button>
            <span className="desktop-menu">
              <PanelLeftClose size={18} />
            </span>
            <span className="crumb-divider" />
            <span>Espacio de trabajo</span>
            <ChevronRight size={14} />
            <strong>
              {resource?.title ||
                currentModule?.short ||
                {
                  "/": "Vista general",
                  "/planificador": "Planificador",
                  "/actividad": "Actividad",
                  "/configuracion": "Configuración",
                  "/cuentas-por-cobrar": "Cuentas por cobrar",
                }[location.pathname] ||
                "Expediente de servicio"}
            </strong>
          </div>
          <div className="topbar-actions">
            <button className="global-search" onClick={() => setSearch(true)}>
              <Search size={16} />
              <span>Buscar en el ERP…</span>
              <kbd>⌕</kbd>
            </button>
            <span className="demo-pill">
              <i /> Demo
            </span>
            <Link
              className="icon-button notification"
              aria-label="Notificaciones"
              to="/actividad"
            >
              <Bell size={19} />
              <i />
            </Link>
            <button
              className="profile-button"
              onClick={() => setProfile(true)}
              aria-label="Ver perfil"
            >
              <span className="avatar">AD</span>
              <ChevronDown size={13} />
            </button>
          </div>
        </header>
        <main
          id="main"
          tabIndex={-1}
          className="main-content"
          key={location.pathname}
        >
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/modulos/:moduleId" element={<Dashboard />} />
            <Route path="/modulos/:moduleId/:key" element={<ResourcePage />} />
            <Route path="/ordenes/:id" element={<OrderDetail />} />
            <Route path="/planificador" element={<Planning />} />
            <Route path="/actividad" element={<Activity />} />
            <Route path="/cuentas-por-cobrar" element={<Receivables />} />
            <Route path="/configuracion" element={<SettingsPage />} />
            <Route
              path="*"
              element={
                <div className="empty">
                  <h1>Página no encontrada</h1>
                  <Link to="/">Volver al inicio</Link>
                </div>
              }
            />
          </Routes>
        </main>
      </div>
      {search && (
        <Modal title="Buscar en PROMECAL" onClose={() => setSearch(false)}>
          <div className="padded">
            <label className="search-box full-width">
              <Search size={18} />
              <input
                autoFocus
                placeholder="Cliente, orden, número de serie…"
                aria-label="Búsqueda global"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <div className="search-results">
              {results.map(({ r, e }) => (
                <button
                  key={e.id}
                  onClick={() => {
                    navigate(
                      r.key === "orders"
                        ? `/ordenes/${e.id}`
                        : `/modulos/${r.module}/${r.key}?q=${e.id}`,
                    );
                    setSearch(false);
                    setQuery("");
                  }}
                >
                  <div>
                    <b>{e.name}</b>
                    <small>
                      {r.title} · {e.id}
                    </small>
                  </div>
                  <ArrowUpRight size={16} />
                </button>
              ))}
              {!results.length && (
                <p className="muted">
                  {query
                    ? "No se encontraron coincidencias."
                    : "Busca en los cinco módulos desde un solo lugar."}
                </p>
              )}
            </div>
          </div>
        </Modal>
      )}
      {profile && (
        <Modal
          title="Usuario de demostración"
          onClose={() => setProfile(false)}
        >
          <div className="padded">
            <p>Administrador · acceso de demostración a los cinco módulos.</p>
            <p className="muted">
              Los perfiles definitivos y la autenticación se implementarán con
              el backend. Las acciones actuales se registran en la bitácora
              local.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
export default function App() {
  return (
    <HashRouter>
      <DataProvider>
        <Shell />
      </DataProvider>
    </HashRouter>
  );
}
