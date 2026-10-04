import type { Database, Entity } from "./types";
import { resources } from "./catalog";
const make = (
  id: string,
  name: string,
  rest: Record<string, string | number | boolean>,
): Entity => ({ id, name, ...rest });
export function createSeed(): Database {
  const records: Database["records"] = Object.fromEntries(
    resources.map((r) => [r.key, []]),
  );
  records.clients = [
    make("CLI-001", "Andes Minería S.A.C.", {
      documentType: "RUC",
      document: "20100000001",
      contact: "María Torres",
      email: "maria@example.com",
      phone: "999 100 201",
      sector: "Minería",
      payment: "Crédito",
      creditLimit: 30000,
      address: "Lima · Perú",
      status: "Activo",
    }),
    make("CLI-002", "Pacífico Industrial S.A.", {
      documentType: "RUC",
      document: "20100000002",
      contact: "Jorge Salas",
      email: "jorge@example.com",
      phone: "999 100 202",
      sector: "Petroquímica",
      payment: "Contado",
      creditLimit: 0,
      address: "Callao · Perú",
      status: "Activo",
    }),
    make("CLI-003", "Laboratorios Nova S.A.C.", {
      documentType: "RUC",
      document: "20100000003",
      contact: "Lucía Prado",
      email: "lucia@example.com",
      phone: "999 100 203",
      sector: "Laboratorio",
      payment: "Crédito",
      creditLimit: 16000,
      address: "Lima · Perú",
      status: "Activo",
    }),
    make("CLI-004", "Textiles del Sur S.A.C.", {
      documentType: "RUC",
      document: "20100000004",
      contact: "Carlos Díaz",
      email: "carlos@example.com",
      phone: "999 100 204",
      sector: "Textil",
      payment: "Contado",
      creditLimit: 0,
      address: "Lima · Perú",
      status: "Activo",
    }),
    make("CLI-005", "Pesquera Costa Azul S.A.", {
      documentType: "RUC",
      document: "20100000005",
      contact: "Ana Ríos",
      email: "ana@example.com",
      phone: "999 100 205",
      sector: "Pesca",
      payment: "Crédito",
      creditLimit: 25000,
      address: "Chimbote · Perú",
      status: "Activo",
    }),
  ];
  const instruments = [
    ["Multímetro digital", "Fluke", "87V", "FL-872041", "Eléctrica"],
    ["Manómetro digital", "WIKA", "CPG1500", "WK-153892", "Presión"],
    ["Termómetro de referencia", "Fluke", "1524", "FL-152408", "Temperatura"],
    ["Variador de frecuencia", "ABB", "ACS580", "ABB-580092", "Eléctrica"],
    ["Luxómetro digital", "Testo", "540", "TS-540125", "Fotometría"],
    ["Transmisor de presión", "Rosemount", "3051", "RM-305176", "Presión"],
    ["Pinza amperimétrica", "Fluke", "376 FC", "FL-376082", "Eléctrica"],
    ["Controlador de temperatura", "Omron", "E5CC", "OM-510091", "Temperatura"],
  ];
  const statuses = [
    "En proceso",
    "En revisión",
    "Programada",
    "En proceso",
    "Liberada",
    "Pendiente",
    "Liberada",
    "Programada",
  ];
  records.equipment = instruments.map((v, i) =>
    make(`EQ-00${i + 1}`, v[0], {
      brand: v[1],
      model: v[2],
      serial: v[3],
      clientId: `CLI-00${(i % 5) + 1}`,
      location:
        i === 4 || i === 6
          ? "Despacho · D1"
          : i === 3
            ? "Servicio técnico"
            : v[4] === "Eléctrica"
              ? "Laboratorio eléctrico"
              : `Laboratorio de ${v[4].toLowerCase()}`,
      physical: "Sin golpes ni rajaduras. Accesorios verificados.",
      status: i === 4 || i === 6 ? "Listo para entrega" : "En laboratorio",
    }),
  );
  records.technicians = [
    make("TEC-001", "Luis Mendoza", {
      magnitude: "Eléctrica",
      role: "Técnico de calibración",
      due: "2027-06-30",
      evidence: "Evaluación interna COMP-014",
      status: "Autorizado",
    }),
    make("TEC-002", "Carolina Vega", {
      magnitude: "Presión",
      role: "Técnico de calibración",
      due: "2027-06-30",
      evidence: "Evaluación interna COMP-018",
      status: "Autorizado",
    }),
    make("TEC-003", "Diego Ramos", {
      magnitude: "Temperatura",
      role: "Técnico de calibración",
      due: "2027-06-30",
      evidence: "Evaluación interna COMP-021",
      status: "Autorizado",
    }),
    make("TEC-004", "Valeria Castro", {
      magnitude: "Fotometría",
      role: "Técnico de calibración",
      due: "2027-06-30",
      evidence: "Evaluación interna COMP-023",
      status: "Autorizado",
    }),
    make("TEC-005", "Miguel Herrera", {
      magnitude: "Eléctrica",
      role: "Especialista de soporte técnico",
      due: "2027-06-30",
      evidence: "Formación en equipos industriales",
      status: "Autorizado",
    }),
  ];
  records.standards = [
    make("PAT-001", "Calibrador multifunción Fluke 5522A", {
      serial: "FL-552201",
      magnitude: "Eléctrica",
      certificate: "REF-2026-018",
      due: "2027-03-15",
    }),
    make("PAT-002", "Balanza de presión CPB3800", {
      serial: "WK-380010",
      magnitude: "Presión",
      certificate: "REF-2026-027",
      due: "2026-10-22",
    }),
    make("PAT-003", "Termómetro patrón 1594A", {
      serial: "FL-159408",
      magnitude: "Temperatura",
      certificate: "REF-2026-031",
      due: "2027-02-10",
    }),
    make("PAT-004", "Fuente luminosa de referencia", {
      serial: "PH-20041",
      magnitude: "Fotometría",
      certificate: "REF-2026-008",
      due: "2027-01-20",
    }),
    make("PAT-005", "Manómetro patrón secundario", {
      serial: "WK-150018",
      magnitude: "Presión",
      certificate: "REF-2025-042",
      due: "2026-09-28",
    }),
  ];
  records.orders = instruments.map((v, i) =>
    make(
      `${i === 3 ? "OT" : "OS"}-2026-00${41 + i}`,
      `${v[0]} · ${v[1]} ${v[2]}`,
      {
        clientId: `CLI-00${(i % 5) + 1}`,
        equipmentId: `EQ-00${i + 1}`,
        service: i === 3 ? "Soporte técnico" : "Calibración",
        magnitude: v[4],
        priority: i === 1 || i === 3 ? "Alta" : i === 5 ? "Urgente" : "Normal",
        date: "2026-10-01",
        due: `2026-10-${String(5 + i).padStart(2, "0")}`,
        amount: [1850, 2400, 960, 3800, 650, 2100, 1450, 1200][i],
        status: statuses[i],
        technicianId: `TEC-00${i === 3 ? 5 : i === 4 ? 4 : i === 2 || i === 7 ? 3 : i === 1 || i === 5 ? 2 : 1}`,
        standardId: `PAT-00${v[4] === "Eléctrica" ? 1 : v[4] === "Presión" ? 2 : v[4] === "Temperatura" ? 3 : 4}`,
        notes:
          i === 1
            ? "Resultados listos para revisión de laboratorio."
            : "Servicio de demostración. Registro ficticio.",
        reviewed: i === 4 || i === 6,
        signed: i === 4 || i === 6,
        diagnosisAccepted: i === 3,
      },
    ),
  );
  records.quotes = records.orders.map((o, i) =>
    make(`PRO-2026-00${81 + i}`, String(o.name), {
      clientId: o.clientId,
      service: o.service,
      orderId: i === 3 ? o.id : "",
      amount: o.amount,
      due: "2026-10-20",
      deliveryDays: 7,
      deliverable:
        i === 3 ? "Informe de reparación" : "Certificado de calibración",
      conditions:
        "Alcance acordado con el cliente según F01-VEN-PR-01. Condiciones de ejemplo.",
      acceptance: `CORREO-ACEP-00${i + 1}`,
      status: i === 5 ? "Enviada" : "Aceptada",
    }),
  );
  records.customerOrders = records.orders
    .filter(
      (o) =>
        records.clients.find((c) => c.id === o.clientId)?.payment === "Crédito",
    )
    .map((o, i) =>
      make(`OCC-00${i + 1}`, `OC-CLIENTE-10${i + 1}`, {
        clientId: o.clientId,
        quoteId: records.quotes.find((q) => q.name === o.name)?.id || "",
        amount: o.amount,
        date: "2026-10-01",
      }),
    );
  records.notes = records.orders
    .filter((_, i) => i !== 5)
    .map((o, i) =>
      make(`NP-2026-00${21 + i}`, String(o.name), {
        orderId: o.id,
        clientId: o.clientId,
        quoteId: records.quotes.find((q) => q.name === o.name)!.id,
        customerOrderId:
          records.customerOrders.find(
            (c) =>
              c.quoteId === records.quotes.find((q) => q.name === o.name)?.id,
          )?.id || "",
        amount: o.amount,
        commitment: o.clientId === "CLI-004" ? "COMP-2026-008" : "",
        status: "Validada",
      }),
    );
  records.receipts = records.orders.map((o, i) =>
    make(`REC-00${i + 1}`, i % 2 ? `F01-2026-0${i + 1}` : `GR-001-00${i + 1}`, {
      orderId: o.id,
      documentType: i % 2 ? "F01-RYD-PR-01" : "Guía de remisión",
      date: "2026-10-01",
      signedBy: "Ana López · Recepción",
      status: "Derivado",
    }),
  );
  records.payments = [
    make("PAG-001", "TRF-928451", {
      orderId: "OS-2026-0042",
      amount: 2400,
      method: "Transferencia",
      date: "2026-10-02",
      status: "Confirmado",
    }),
    make("PAG-002", "DEP-193028", {
      orderId: "OS-2026-0047",
      amount: 1450,
      method: "Depósito",
      date: "2026-10-03",
      status: "Por conciliar",
    }),
  ];
  records.invoices = [
    make("FAC-001", "DEMO-F001-001", {
      clientId: "CLI-005",
      orderId: "OS-2026-0045",
      amount: 650,
      due: "2026-10-30",
      status: "Pendiente",
    }),
    make("FAC-002", "DEMO-F001-002", {
      clientId: "CLI-002",
      orderId: "OS-2026-0042",
      amount: 2400,
      due: "2026-10-06",
      status: "Pagada",
    }),
  ];
  records.diagnoses = [
    make("DIA-001", "Falla en etapa de potencia", {
      orderId: "OT-2026-0044",
      findings: "Componentes de potencia deteriorados.",
      recommendation: "Reemplazo y pruebas funcionales.",
      amount: 250,
      decision: "Aceptado",
      status: "Reparable",
    }),
  ];
  records.results = [
    make("RES-001", "Punto de presión · 100 bar", {
      orderId: "OS-2026-0042",
      reference: 100,
      reading: 100.02,
      error: 0.02,
      unit: "bar",
      notes: "Condiciones ambientales registradas en ficha de laboratorio.",
      status: "Registrado",
    }),
    make("RES-002", "Punto eléctrico · 10 V", {
      orderId: "OS-2026-0041",
      reference: 10,
      reading: 10.001,
      error: 0.001,
      unit: "V",
      notes: "Lectura de ejemplo; cálculo de incertidumbre pendiente.",
      status: "Borrador",
    }),
  ];
  records.certificates = [
    make("DOC-001", "Certificado de calibración", {
      orderId: "OS-2026-0045",
      date: "2026-10-03",
      reviewer: "Jefe de laboratorio · Demo",
      status: "Liberado",
    }),
    make("DOC-002", "Certificado de calibración", {
      orderId: "OS-2026-0047",
      date: "2026-10-03",
      reviewer: "Jefe de laboratorio · Demo",
      status: "Liberado",
    }),
  ];
  records.stock = [
    make("REP-001", "Fusible cerámico 11 A", {
      sku: "FUS-11A",
      quantity: 3,
      minimum: 5,
      cost: 42,
      location: "Almacén · B2",
    }),
    make("REP-002", "Kit de sellos de presión", {
      sku: "SEL-P01",
      quantity: 12,
      minimum: 4,
      cost: 85,
      location: "Almacén · B3",
    }),
    make("REP-003", "Módulo IGBT de potencia", {
      sku: "IGBT-580",
      quantity: 1,
      minimum: 2,
      cost: 780,
      location: "Almacén · C1",
    }),
    make("REP-004", "Alcohol isopropílico 1 L", {
      sku: "INS-IPA",
      quantity: 18,
      minimum: 6,
      cost: 28,
      location: "Almacén · A2",
    }),
  ];
  records.suppliers = [
    make("PRV-001", "Suministros Técnicos del Perú", {
      document: "20100000011",
      contact: "Pedro León",
      email: "pedro@example.com",
      phone: "999 200 101",
      status: "Activo",
    }),
    make("PRV-002", "Instrumentación Industrial S.A.C.", {
      document: "20100000012",
      contact: "Sofía Vera",
      email: "sofia@example.com",
      phone: "999 200 102",
      status: "Activo",
    }),
  ];
  records.purchases = [
    make("OCP-001", "Reposición de módulos de potencia", {
      supplierId: "PRV-001",
      orderId: "OT-2026-0044",
      stockId: "REP-003",
      quantity: 2,
      amount: 1560,
      due: "2026-10-08",
      status: "Emitida",
    }),
  ];
  records.costs = [
    make("COS-001", "Horas de especialista · diagnóstico", {
      orderId: "OT-2026-0044",
      category: "Mano de obra",
      amount: 180,
      date: "2026-10-02",
    }),
    make("COS-002", "Módulo de potencia utilizado", {
      orderId: "OT-2026-0044",
      category: "Repuesto",
      amount: 780,
      date: "2026-10-03",
    }),
    make("COS-003", "Calibración de presión · 3 horas", {
      orderId: "OS-2026-0042",
      category: "Mano de obra",
      amount: 240,
      date: "2026-10-03",
    }),
  ];
  records.nonconformities = [
    make("NC-001", "Diferencia en registro de temperatura", {
      orderId: "OS-2026-0043",
      owner: "Responsable de Calidad",
      cause: "Transcripción manual del registro previo.",
      action: "Revisar y repetir captura de resultados.",
      due: "2026-10-09",
      status: "En tratamiento",
    }),
  ];
  records.requests = [
    make("SOL-001", "Calibración anual de instrumentos", {
      clientId: "CLI-001",
      service: "Calibración",
      channel: "Correo electrónico",
      date: "2026-10-03",
      status: "Nueva",
    }),
    make("SOL-002", "Diagnóstico de controlador", {
      clientId: "CLI-004",
      service: "Soporte técnico",
      channel: "Teléfono",
      date: "2026-10-04",
      status: "En evaluación",
    }),
  ];
  records.collections = [
    make("COB-001", "Confirmar recepción de factura", {
      clientId: "CLI-005",
      orderId: "OS-2026-0045",
      due: "2026-10-12",
      status: "Pendiente",
    }),
  ];
  records.warranties = [
    make("GAR-001", "Evaluación de falla recurrente", {
      clientId: "CLI-004",
      originalOrderId: "OT-2026-0044",
      due: "2026-12-31",
      diagnosis: "Evaluación técnica de cobertura pendiente.",
      amount: 0,
      status: "En evaluación",
    }),
  ];
  records.documents = [
    ["F01-VEN-PR-01", "Alcance del servicio", "Ventas"],
    ["RYD-PR-01", "Recepción y despacho", "Logística"],
    ["F01-RYD-PR-01", "Recepción sin guía", "Logística"],
    ["CAL-PR-06", "Emisión de certificados e informes", "Laboratorio"],
    ["F06-CAL-PR-04", "Acta de entrega de calibración", "Laboratorio"],
    ["STO-PR-01", "Servicio técnico", "Servicio técnico"],
    ["F01-SIG-PR-05", "Registro de salida no conforme", "Calidad"],
  ].map((d, i) =>
    make(`SIG-00${i + 1}`, d[1], {
      code: d[0],
      owner: d[2],
      revision: "Por validar",
      date: "2026-10-01",
      status: "Vigente",
      notes:
        "Referencia identificada en el proyecto. Texto completo del procedimiento pendiente de incorporar.",
    }),
  );
  return {
    version: 1,
    records,
    events: [
      {
        id: "EV-001",
        entityId: "OS-2026-0042",
        text: "Resultados registrados · pendiente de revisión",
        at: "2026-10-04T09:40:00-05:00",
        actor: "Carolina Vega",
      },
      {
        id: "EV-002",
        entityId: "PAG-002",
        text: "Pago recibido para conciliación",
        at: "2026-10-04T09:15:00-05:00",
        actor: "Administración",
      },
      {
        id: "EV-003",
        entityId: "OS-2026-0045",
        text: "Certificado liberado · equipo listo para entrega",
        at: "2026-10-03T16:30:00-05:00",
        actor: "Calidad",
      },
    ],
  };
}
