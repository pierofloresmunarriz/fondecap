/* =============================================
   CONSULTA DE RESULTADOS — resultados.js
   ============================================= */

// URL del Web App de Apps Script conectado a la hoja "Comunicación de
// resultados" (Hoja 1: DNI | NOMBRES Y APELLIDOS | RESULTADO | CARRERA | HORARIO).
// Reemplaza este valor por la URL /exec que te entrega Apps Script al
// publicar el despliegue (ver apps-script/resultados.gs para el código
// del backend y las instrucciones de despliegue).
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyE7lws36TA-Rxdrq97T2liA1wKDydmZDBwiNBIc1ymVgK-XsWKJ2Ix0HHpUC21SSxH/exec";

// ── Helpers de DOM ──────────────────────────────────────────
function el(id) {
  return document.getElementById(id);
}

function goTo(step) {
  document.querySelectorAll(".step-panel").forEach((panel, i) => {
    panel.classList.toggle("active", i === step);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function mostrarError(inp, err, msg) {
  inp.classList.add("error");
  err.textContent = msg;
  err.classList.add("show");
}

function limpiarError(inp, err) {
  inp.classList.remove("error");
  err.classList.remove("show");
}

function resetBtn(btn) {
  btn.innerHTML =
    'Ver resultado <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>';
  btn.disabled = false;
}

// ── SVG helpers ─────────────────────────────────────────────
function iconoCheck() {
  return `<svg width="40" height="40" fill="#2d6a4f" viewBox="0 0 24 24">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
  </svg>`;
}

function iconoCancel() {
  return `<svg width="40" height="40" fill="#d2292a" viewBox="0 0 24 24">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/>
  </svg>`;
}

// ── Consulta del resultado (100% contra el servidor) ────────
async function consultarResultado() {
  const inp = el("dniInput");
  const err = el("dniError");
  const btn = document.querySelector("#panel0 .btn-primary");
  const val = inp.value.trim();

  if (!/^\d{7,8}$/.test(val)) {
    mostrarError(inp, err, "Ingresa un DNI válido de 8 dígitos.");
    return;
  }

  limpiarError(inp, err);
  btn.textContent = "Consultando...";
  btn.disabled = true;

  let data;
  try {
    const res = await fetch(`${APPS_SCRIPT_URL}?dni=${val}`, {
      redirect: "follow",
    });
    data = await res.json();
  } catch (e) {
    resetBtn(btn);
    mostrarError(
      inp,
      err,
      "No se pudo consultar tu resultado en este momento. Intenta nuevamente en unos segundos.",
    );
    return;
  }

  resetBtn(btn);

  if (!data || !data.encontrado) {
    mostrarError(
      inp,
      err,
      "Este DNI no se encuentra en la lista de postulantes.",
    );
    return;
  }

  mostrarResultado(val, data);
}

function mostrarResultado(dni, data) {
  const seleccionado = (data.resultado || "")
    .toString()
    .trim()
    .toUpperCase()
    .startsWith("SELECCIONADO");

  el("resDni").textContent = dni;
  el("resNombre").textContent = data.nombres || "—";
  el("resCarrera").textContent = data.carrera || "—";
  el("resHorario").textContent = data.horario || "—";

  // La carrera y el horario solo importan si fue seleccionado; si no
  // ingresó, esos datos ya no son relevantes.
  el("rowCarrera").hidden = !seleccionado;
  el("rowHorario").hidden = !seleccionado;

  const icon = el("resultIcon");
  const badge = el("resultBadge");
  const title = el("resultTitle");

  icon.classList.toggle("not-selected", !seleccionado);
  badge.classList.toggle("selected", seleccionado);
  badge.classList.toggle("not-selected", !seleccionado);

  if (seleccionado) {
    icon.innerHTML = iconoCheck();
    title.textContent = "¡Felicitaciones!";
    badge.textContent = "SELECCIONADO/A";
  } else {
    icon.innerHTML = iconoCancel();
    title.textContent = "Resultado de tu postulación";
    badge.textContent = "NO SELECCIONADO/A";
  }

  goTo(1);
}

// ── Event listeners al cargar el DOM ────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  const dniInput = el("dniInput");
  dniInput.addEventListener("input", () => {
    dniInput.value = dniInput.value.replace(/\D/g, "");
  });
  dniInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") consultarResultado();
  });

  document
    .querySelector("#panel0 .btn-primary")
    .addEventListener("click", consultarResultado);

  el("btnOtraConsulta").addEventListener("click", () => {
    const inp = el("dniInput");
    const err = el("dniError");
    inp.value = "";
    limpiarError(inp, err);
    goTo(0);
    inp.focus();
  });
});
