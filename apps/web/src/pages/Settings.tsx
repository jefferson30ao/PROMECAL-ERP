import { useState } from "react";
import { Download, RotateCcw, CheckCircle2, Link2 } from "lucide-react";
import { PageTitle, Panel, Modal, download } from "../components/ui";
import { useData } from "../data/context";
import { createSeed } from "../../../../packages/domain/seed";
export function Settings() {
  const { db, commit, toast } = useData(),
    [reset, setReset] = useState(false),
    [error, setError] = useState("");
  return (
    <>
      <PageTitle
        title="Configuración del espacio"
        description="Información de la empresa y alcance de esta primera versión."
      />
      <div className="two-columns">
        <div>
          <Panel
            title="PROMECAL S.A.C."
            subtitle="Servicios de metrología e ingeniería"
          >
            <dl className="detail-grid">
              <div>
                <dt>Ubicación</dt>
                <dd>Lima, Perú</dd>
              </div>
              <div>
                <dt>Moneda de presentación</dt>
                <dd>Soles (PEN)</dd>
              </div>
              <div>
                <dt>RUC / domicilio fiscal</dt>
                <dd>Pendiente de completar</dd>
              </div>
              <div>
                <dt>Entorno</dt>
                <dd>Demostración local</dd>
              </div>
            </dl>
          </Panel>
          <Panel title="Datos de la demostración">
            <div className="padded">
              <p>
                Los registros se guardan en este navegador. Son datos ficticios
                para explorar los procesos y no se comparten entre dispositivos.
              </p>
              <div className="button-row">
                <button
                  className="button secondary"
                  onClick={() =>
                    download(
                      "promecal-respaldo.json",
                      JSON.stringify(db, null, 2),
                      "application/json",
                    )
                  }
                >
                  <Download size={16} /> Exportar respaldo
                </button>
                <button
                  className="button secondary"
                  onClick={() => setReset(true)}
                >
                  <RotateCcw size={16} /> Restablecer demo
                </button>
              </div>
            </div>
          </Panel>
        </div>
        <Panel title="Integraciones">
          <div className="integration-list">
            {[
              "SUNAT · facturación electrónica",
              "Bancos · conciliación automática",
              "Firma electrónica de certificados",
              "Correo · notificaciones al cliente",
              "Contabilidad · asientos y exportación",
              "Fluke COMPASS · resultados",
            ].map((s) => (
              <div key={s}>
                <Link2 size={18} />
                <span>{s}</span>
                <small>Pendiente</small>
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <Panel title="Base funcional y decisiones">
        <div className="padded assumptions">
          <p>
            <CheckCircle2 size={17} /> Fuente principal: Proyecto ERP PROMECAL,
            secciones 5.4 y 6.1.1.
          </p>
          <p>
            Calibración se cotiza antes de la recepción; soporte requiere
            diagnóstico con costo antes de la proforma de reparación. Cada área
            comparte los mismos clientes, equipos y órdenes.
          </p>
          <p>
            Los estados detallados, alertas a 30 días y procedimientos de
            inventario/compras son supuestos de diseño. La garantía de monto
            cero es una propuesta del documento principal que requiere
            validación empresarial.
          </p>
          <p>
            La firma, los comprobantes y los cálculos presentados son de
            demostración. El análisis completo, las diferencias con el SAP y los
            pendientes están en <strong>docs/ANALISIS.md</strong>.
          </p>
        </div>
      </Panel>
      {reset && (
        <Modal
          title="Restablecer los datos de ejemplo"
          onClose={() => setReset(false)}
        >
          <div className="padded">
            <p>
              Se reemplazarán los registros de este navegador por los datos
              iniciales. Puedes exportar un respaldo antes de continuar.
            </p>
            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}
          </div>
          <div className="modal-footer">
            <button
              className="button secondary"
              onClick={() => setReset(false)}
            >
              Cancelar
            </button>
            <button
              className="button primary"
              onClick={async () => {
                try {
                  await commit(createSeed());
                  setReset(false);
                  toast("Datos de demostración restablecidos");
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              Restablecer demostración
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
