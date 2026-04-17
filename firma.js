/* =============================================
   FIRMA CONVENIO — firma.js
   ============================================= */

const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycby8Q2C6TvsTjjmp7TLWzGsDvMlxyletRYfPqnnq31VBaA4dvRo6S_NZW5n8KzLjG1XeMA/exec";

const BECARIOS = {
  71100379: "Aaron Josue Matute Escobedo",
  46064667: "Albert Adrian Guerrero Zapata",
  41249117: "Alberto Sanchez Fernandez",
  44633264: "Alexander Berrocal Salcedo",
  75937415: "Alindor Portal Casquin",
  74954081: "Álvaro Pucho Pucho",
  42523462: "Belisario Lima Sullca",
  61412254: "Brando Javier Iñape Castillo",
  48073422: "Carlos Andrés Atoche Botton",
  71353485: "Charles Lima Encarnacion",
  44353126: "Denis Junior Saucedo Hernández",
  42438832: "Edgar Alfredo Barrientos Urbano",
  45022392: "Edgar Wilder Ponce Sobero",
  9364719: "Edgard Miguel Zamora Irrazabal",
  45317389: "Edson Flores Santoyo",
  44628553: "Edwin Cristhian Ortega Vivar",
  75781356: "Emerson Huaman Chavez",
  72917298: "Enrique Neptali Nuñez Flores",
  61123969: "Fabian Alberto Sanchez Corrales",
  48407793: "Fidel Gallegos Ramos",
  42013163: "Fredhy Alberto Malpartida Montecillo",
  72907953: "Gerson Fharid Torres Llantoy",
  47129727: "Grider Jarvin Alvarado Soto",
  48111233: "Harold Smith Cruz Castillo",
  70509536: "Heberth Eduardo Espinoza Chiclla",
  43871643: "Hilda Elizares Pilpe",
  41431806: "Jimmy Rico Bazan",
  72611040: "Job Cusquisiban Torres",
  74128360: "Juan Anthony Cueva Moreno",
  76287516: "Juan Carlos Casimiro Pascual",
  71756475: "Juan Carlos Llaullipoma Carhuamanta",
  71541786: "Kiara Estefany Karolina Espino Solier",
  80502545: "Lizandro Raul Correa Baldeon",
  44174866: "Luis Enrique Asmad Gerónimo",
  47631507: "Luis Jesús Pinedo Camilo",
  46495453: "Marino Melendez Lopez",
  72428086: "Michael Castro Vilchez",
  45040109: "Mike Esteban Villanueva Fernandez",
  72232881: "Wilber Huillca Sueldo",
  73581729: "Wily Arizaca Choquehuayta",
  75987723: "Yerson Henry Ayamamani Gonzales",
  45489461: "Yinmy Puerta Arone",
  76445300: "Yonathan Smith Rivera Alama",
  48905624: "Nick Romero Chavez"
};

// Estado global de la sesión
const state = {
  dni: "",
  nombre: "",
  ts_convenio: "",
  ts_reglamento: "",
};

// ── Helpers de DOM ──────────────────────────────────────────
function el(id) {
  return document.getElementById(id);
}

function formatDate(d) {
  return (
    d.toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }) +
    " " +
    d.toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  );
}

// ── Navegación entre pasos ──────────────────────────────────
function goTo(step) {
  document.querySelectorAll(".step-panel").forEach((panel, i) => {
    panel.classList.toggle("active", i === step);
  });
  document.querySelectorAll(".progress-step").forEach((s, i) => {
    s.classList.remove("active", "done");
    if (i < step) s.classList.add("done");
    else if (i === step) s.classList.add("active");
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ── Validación y verificación del DNI ──────────────────────
async function validarDNI() {
  const inp = el("dniInput");
  const err = el("dniError");
  const btn = document.querySelector("#panel0 .btn-primary");
  const val = inp.value.trim();

  // Validación de formato
  if (!/^\d{7,8}$/.test(val)) {
    mostrarError(inp, err, "Ingresa un DNI válido de 8 dígitos.");
    return;
  }

  // Validación contra lista de becarios
  const nombre = BECARIOS[val];
  if (!nombre) {
    mostrarError(
      inp,
      err,
      "Este DNI no se encuentra en la lista de becarios seleccionados.",
    );
    return;
  }

  // Verificar en el servidor si ya firmó
  btn.textContent = "Verificando...";
  btn.disabled = true;

  try {
    const res = await fetch(`${APPS_SCRIPT_URL}?dni=${val}`, {
      redirect: "follow",
    });
    const data = await res.json();

    if (data.firmado) {
      manejarYaFirmado(val, nombre, data);
      resetBtn(btn);
      return;
    }
  } catch {
    // Si falla la consulta al servidor, permitimos continuar
  }

  resetBtn(btn);
  limpiarError(inp, err);
  iniciarFlujoNuevo(val, nombre);
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
    'Continuar <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>';
  btn.disabled = false;
}

// Becario que ya firmó: mostrar mensaje y botones de descarga
function manejarYaFirmado(val, nombre, data) {
  const inp = el("dniInput");
  const err = el("dniError");

  mostrarError(
    inp,
    err,
    "Este DNI ya completó el proceso de firma anteriormente.",
  );

  const tsConvenioFmt = data.ts_convenio
    ? formatDate(new Date(data.ts_convenio))
    : "—";
  const tsReglamentoFmt = data.ts_reglamento
    ? formatDate(new Date(data.ts_reglamento))
    : "—";

  // Guardar en state para que imprimirDocumento funcione
  state.dni = val;
  state.nombre = nombre;
  state.ts_convenio = data.ts_convenio || "";
  state.ts_reglamento = data.ts_reglamento || "";

  // Llenar elementos necesarios para la impresión
  el("successTs1").textContent = tsConvenioFmt;
  el("successTs2").textContent = tsReglamentoFmt;
  el("dniConvenio").textContent = val;
  el("successDNI").textContent = val;
  el("successNombre").textContent = nombre;

  // Mostrar botones de descarga solo si no existen
  if (!el("btnDescargaYaFirmado")) {
    const wrap = document.createElement("div");
    wrap.id = "btnDescargaYaFirmado";
    wrap.className = "btn-download-row";
    wrap.style.marginTop = "16px";
    wrap.innerHTML = `
      <button class="btn-pdf" data-tipo="convenio">
        ${iconoPDF()} Descargar Convenio
      </button>
      <button class="btn-pdf" data-tipo="reglamento">
        ${iconoPDF()} Descargar Reglamento
      </button>
    `;
    wrap.querySelectorAll(".btn-pdf").forEach((b) => {
      b.addEventListener("click", () => imprimirDocumento(b.dataset.tipo));
    });
    document.querySelector("#panel0 .dni-card").appendChild(wrap);
  }
}

// Becario nuevo: llenar datos y avanzar al paso 1
function iniciarFlujoNuevo(val, nombre) {
  state.dni = val;
  state.nombre = nombre;

  el("dniBadge1").textContent = val;
  el("dniBadge2").textContent = val;
  el("dniConvenio").textContent = val;
  el("successDNI").textContent = val;
  el("successNombre").textContent = nombre;

  goTo(1);
}

// ── Scroll indicator ────────────────────────────────────────
function checkScroll(scrollId, indicatorId) {
  const scroll = el(scrollId);
  const ind = el(indicatorId);
  const atBottom =
    scroll.scrollHeight - scroll.scrollTop - scroll.clientHeight < 30;
  ind.classList.toggle("hidden", atBottom);
}

// ── Checkbox de aceptación ──────────────────────────────────
function toggleAccept(checkId, boxId, tsId, btnId) {
  const checked = el(checkId).checked;
  const box = el(boxId);
  const ts = el(tsId);
  const btn = el(btnId);
  const tsText = el(tsId + "Text");

  box.classList.toggle("checked", checked);
  btn.disabled = !checked;

  if (checked) {
    const now = new Date();
    const formatted = formatDate(now);
    tsText.textContent = "Aceptado el " + formatted;
    ts.classList.add("show");

    if (checkId === "checkConvenio") {
      state.ts_convenio = now.toISOString();
      el("successTs1").textContent = formatted;
    } else {
      state.ts_reglamento = now.toISOString();
      el("successTs2").textContent = formatted;
    }
  } else {
    ts.classList.remove("show");
    if (checkId === "checkConvenio") state.ts_convenio = "";
    else state.ts_reglamento = "";
  }
}

// ── Envío de firma al servidor ──────────────────────────────
async function enviarFirma() {
  const overlay = el("loadingOverlay");
  overlay.classList.add("show");

  const payload = {
    dni: state.dni,
    nombre: state.nombre,
    ts_convenio: state.ts_convenio,
    ts_reglamento: state.ts_reglamento,
    ts_envio: new Date().toISOString(),
  };

  try {
    await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    console.error("Error al enviar firma:", e);
  }

  overlay.classList.remove("show");
  goTo(3);
}

// ── Impresión / descarga de documento ──────────────────────
function imprimirDocumento(tipo) {
  const printArea = el("printArea");
  const tsConvenio = el("successTs1").textContent;
  const tsReglamento = el("successTs2").textContent;

  const firmaBlock = `
    <div class="firma-block">
      <p class="firma-dato"><strong>Becario/a:</strong> ${state.nombre}</p>
      <p class="firma-dato"><strong>DNI:</strong> ${state.dni}</p>
      <p class="firma-dato"><strong>Fecha de firma:</strong> ${tipo === "convenio" ? tsConvenio : tsReglamento}</p>
      <p class="firma-dato"><strong>Aceptación:</strong> Firma digital registrada electrónicamente</p>
    </div>
  `;

  const contenido =
    tipo === "convenio"
      ? el("scrollConvenio").innerHTML
      : el("scrollReglamento").innerHTML;

  printArea.innerHTML = contenido + firmaBlock;
  window.print();
  printArea.innerHTML = "";
}

// ── SVG helpers ─────────────────────────────────────────────
function iconoPDF() {
  return `<svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
  </svg>`;
}

// ── Event listeners al cargar el DOM ────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  // Input DNI: solo números
  const dniInput = el("dniInput");
  dniInput.addEventListener("input", () => {
    dniInput.value = dniInput.value.replace(/\D/g, "");
  });
  dniInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") validarDNI();
  });

  // Botón continuar paso 0
  document
    .querySelector("#panel0 .btn-primary")
    .addEventListener("click", validarDNI);

  // Botones atrás
  document
    .querySelector("#panel1 .btn-secondary")
    .addEventListener("click", () => goTo(0));
  document
    .querySelector("#panel2 .btn-secondary")
    .addEventListener("click", () => goTo(1));

  // Botón continuar al reglamento
  el("btnConvenio").addEventListener("click", () => goTo(2));

  // Botón firmar y enviar
  el("btnReglamento").addEventListener("click", enviarFirma);

  // Checkboxes de aceptación
  el("checkConvenio").addEventListener("change", () =>
    toggleAccept("checkConvenio", "acceptBox1", "ts1", "btnConvenio"),
  );
  el("checkReglamento").addEventListener("change", () =>
    toggleAccept("checkReglamento", "acceptBox2", "ts2", "btnReglamento"),
  );

  // Scroll indicators
  el("scrollConvenio").addEventListener("scroll", () =>
    checkScroll("scrollConvenio", "indicatorConvenio"),
  );
  el("scrollReglamento").addEventListener("scroll", () =>
    checkScroll("scrollReglamento", "indicatorReglamento"),
  );

  // Botones de descarga en paso 3
  document.querySelectorAll("[data-imprimir]").forEach((btn) => {
    btn.addEventListener("click", () =>
      imprimirDocumento(btn.dataset.imprimir),
    );
  });
});
