const usuarioSesion = JSON.parse(localStorage.getItem('usuario_sesion'));

if (!usuarioSesion || usuarioSesion.rol !== 'CLIENTE') {
  window.location.href = 'index.html';
}

document.getElementById('nombreUsuario').textContent = `Hola, ${usuarioSesion.nombres}`;

function escaparHTML(valor) {
  return String(valor).replace(/[&<>"']/g, caracter => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[caracter]);
}

function cargarTickets() {
  const tickets = JSON.parse(localStorage.getItem('sony_tickets')) || [];
  const misTickets = tickets.filter(t => t.clienteId === usuarioSesion.id);
  const contenedor = document.getElementById('listaTickets');

  if (misTickets.length === 0) {
    contenedor.innerHTML = '<p class="text-gray-500 text-sm py-4">No tienes solicitudes pendientes.</p>';
    return;
  }

  contenedor.innerHTML = misTickets.map(ticket => {
    // Cálculo del porcentaje de progreso y tiempo estimado
    const datosProgreso = calcularProgresoYTiempo(ticket);

    return `
            <div class="border rounded-lg p-5 bg-white shadow-sm border-l-4 ${obtenerBordeGravedad(ticket.gravedad)}">
                <div class="flex justify-between items-start gap-2 mb-2">
                    <div>
                        <span class="text-xs font-bold text-red-600">${ticket.codigo}</span>
                        <span class="text-xs px-2 py-0.5 rounded font-bold ml-2 ${obtenerBadgeGravedad(ticket.gravedad)}">
                            Prioridad: ${ticket.gravedad || 'MEDIA'}
                        </span>
                        <h3 class="font-bold text-gray-800 text-base mt-1">${ticket.producto}</h3>
                        <p class="text-[11px] text-gray-500">Boleta: ${ticket.numeroBoleta || 'N/A'} | Fecha de Registro: ${ticket.fechaCreacion}</p>
                    </div>
                    <button onclick="eliminarTicket(${ticket.id})" class="text-xs text-red-500 hover:text-red-700 bg-red-50 px-2 py-1 rounded">
                         Eliminar
                    </button>
                </div>

                <!--  BARRA DE PROGRESO Y ESTIMACIÓN DE TIEMPO EN TIEMPO REAL -->
                <div class="my-4 bg-gray-50 p-3.5 rounded-lg border border-gray-200">
                    <div class="flex flex-col sm:flex-row justify-between text-xs text-gray-700 font-semibold mb-1.5 gap-1">
                        <span class="flex items-center gap-1">
                             Estado: <span class="text-red-600 font-bold">${formatearEstado(ticket.estado)}</span>
                        </span>
                        <span class="flex items-center gap-1 text-gray-600">
                            ️ Estimación de Atención: <span class="text-blue-900 font-bold">${datosProgreso.textoTiempo}</span>
                        </span>
                    </div>

                    <!-- Gráfica de Barra -->
                    <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner my-2">
                        <div class="bg-gradient-to-r from-red-500 to-red-700 h-3 rounded-full transition-all duration-700" style="width: ${datosProgreso.porcentaje}%"></div>
                    </div>

                    <div class="flex justify-between text-[11px] text-gray-400 font-medium">
                        <span>1. Recepción</span>
                        <span>2. Diagnóstico</span>
                        <span>3. Aprobación</span>
                        <span>4. Finalizado</span>
                    </div>
                </div>

                <!-- ALERTA DE GARANTÍA VENCIDA -->
                ${ticket.garantiamVencida && !ticket.clienteAceptoRevisionPago ? `
                    <div class="my-3 bg-red-50 border-l-4 border-red-500 p-3 rounded text-xs text-red-900 space-y-2">
                        <p><strong>⚠️ Evaluación 1 (Garantía Vencida):</strong> Tu boleta indica que el producto tiene más de 1 año. Se aplicarán costos de reparación tras el diagnóstico técnico.</p>
                        <div class="flex gap-2">
                            <button onclick="responderGarantiaVencida(${ticket.id}, true)" class="bg-red-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-red-700">
                                Acepto revisión con costo adicional
                            </button>
                            <button onclick="responderGarantiaVencida(${ticket.id}, false)" class="bg-gray-200 text-gray-800 px-3 py-1 rounded text-xs font-bold hover:bg-gray-300">
                                Cancelar solicitud
                            </button>
                        </div>
                    </div>
                ` : ''}

                <!-- ALERTA DE PRESUPUESTO CONFIRMADO POR ADMIN -->
                ${ticket.estado === 'PRESUPUESTO_ENVIADO' ? `
                    <div class="my-3 bg-blue-50 border-l-4 border-blue-500 p-3 rounded text-xs text-blue-900 space-y-2">
                        <p><strong> Presupuesto Oficial Validado por Sony:</strong></p>
                        <p class="text-sm font-bold text-blue-950">Monto de Reparación: S/. ${ticket.costoOficialAdmin}</p>
                        <p><strong>Diagnóstico:</strong> ${ticket.diagnostico}</p>
                        <div class="flex gap-2 pt-1">
                            <button onclick="responderPresupuesto(${ticket.id}, true)" class="bg-green-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-green-700">
                                 Aceptar Reparación y Costo
                            </button>
                            <button onclick="responderPresupuesto(${ticket.id}, false)" class="bg-gray-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-gray-700">
                                 Rechazar Reparación
                            </button>
                        </div>
                    </div>
                ` : ''}

                <p class="text-xs text-gray-700 bg-gray-50 p-2.5 rounded border border-gray-100 my-2">
                    <strong>Descripción del problema:</strong> ${ticket.descripcionFalla}
                </p>

                ${ticket.solucion ? `
                    <div class="mt-2 p-2.5 bg-green-50 border border-green-200 text-green-900 text-xs rounded">
                        <strong>Solución Aplicada:</strong> ${ticket.solucion}
                    </div>
                ` : ''}

                <section class="mt-4 border border-gray-200 rounded-lg p-3" aria-label="Chat con el técnico">
                    <h4 class="text-sm font-bold text-gray-800 mb-2">Chat con el técnico</h4>
                    ${ticket.tecnicoId ? `
                        <div class="space-y-2 max-h-56 overflow-y-auto mb-3" aria-live="polite">
                            ${(ticket.mensajesChat || []).length ? ticket.mensajesChat.map(mensaje => `
                                <div class="rounded p-2 text-xs ${mensaje.remitente === 'CLIENTE' ? 'bg-red-50 ml-4' : 'bg-blue-50 mr-4'}">
                                    <div class="flex justify-between gap-2 text-gray-500 mb-1">
                                        <strong>${escaparHTML(mensaje.nombre)}</strong>
                                        <time>${escaparHTML(new Date(mensaje.fecha).toLocaleString('es-PE'))}</time>
                                    </div>
                                    <p class="text-gray-800 whitespace-pre-wrap break-words">${escaparHTML(mensaje.texto)}</p>
                                </div>
                            `).join('') : '<p class="text-xs text-gray-500">Aún no hay mensajes.</p>'}
                        </div>
                        <form onsubmit="enviarMensajeChat(event, ${ticket.id})" class="flex gap-2">
                            <label for="mensajeChat-${ticket.id}" class="sr-only">Escribe un mensaje al técnico</label>
                            <input id="mensajeChat-${ticket.id}" type="text" maxlength="1000" required
                                   class="min-w-0 flex-1 border rounded px-3 py-2 text-sm"
                                   placeholder="Escribe un mensaje...">
                            <button type="submit" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-semibold">
                                Enviar
                            </button>
                        </form>
                    ` : '<p class="text-xs text-gray-500">El chat estará disponible cuando un técnico tome tu solicitud.</p>'}
                </section>
            </div>
        `;
  }).join('');
}

// Función para calcular porcentaje de barra y tiempo estimado de atención
function calcularProgresoYTiempo(ticket) {
  let porcentaje = 10;
  let textoTiempo = "24 a 48 horas hábiles";

  switch(ticket.estado) {
    case 'REGISTRADO':
      porcentaje = 25;
      textoTiempo = ticket.gravedad === 'ALTA' ? "~24 Horas hábiles (Urgente)" : "~2 a 3 días hábiles";
      break;
    case 'EN_REVISION':
      porcentaje = 50;
      textoTiempo = "~24 Horas para dictamen técnico";
      break;
    case 'PENDIENTE_APROBACION_ADMIN':
      porcentaje = 65;
      textoTiempo = "~12 Horas para validación de costos Sony";
      break;
    case 'REVISAR_PRECIO_TECNICO':
      porcentaje = 60;
      textoTiempo = "~12 Horas para reajuste técnico";
      break;
    case 'PRESUPUESTO_ENVIADO':
      porcentaje = 75;
      textoTiempo = "Esperando tu confirmación para proceder";
      break;
    case 'REPARACION_ACEPTADA':
      porcentaje = 88;
      textoTiempo = "~2 a 4 días para reparación y pruebas de calidad";
      break;
    case 'REPARACION_RECHAZADA':
      porcentaje = 100;
      textoTiempo = "Cancelado por el cliente";
      break;
    case 'RESUELTO':
      porcentaje = 100;
      textoTiempo = "¡Atención Concluida! Listo para recogida";
      break;
  }

  return { porcentaje, textoTiempo };
}

document.getElementById('ticketForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const fileInput = document.getElementById('fotoEvidencia');
  const fechaCompraVal = new Date(document.getElementById('fechaCompra').value);
  const hoy = new Date();

  const diffDias = Math.floor((hoy - fechaCompraVal) / (1000 * 60 * 60 * 24));
  const esGarantiaVencida = diffDias > 365;

  const guardarTicket = (imgBase64) => {
    const tickets = JSON.parse(localStorage.getItem('sony_tickets')) || [];
    const nuevoTicket = {
      id: Date.now(),
      codigo: "TCK-2026-" + Math.floor(1000 + Math.random() * 9000),
      producto: document.getElementById('producto').value,
      numeroSerie: document.getElementById('numeroSerie').value,
      numeroBoleta: document.getElementById('numeroBoleta').value,
      fechaCompra: document.getElementById('fechaCompra').value,
      garantiamVencida: esGarantiaVencida,
      clienteAceptoRevisionPago: !esGarantiaVencida,
      categoria: document.getElementById('categoria').value,
      descripcionFalla: document.getElementById('descripcionFalla').value,
      evidenciaImg: imgBase64 || "",
      estado: "REGISTRADO",
      gravedad: esGarantiaVencida ? "MEDIA" : "BAJA",
      clienteId: usuarioSesion.id,
      tecnicoId: null,
      mensajesChat: [],
      diagnostico: "",
      aplicaGarantia: !esGarantiaVencida,
      costoPropuestoTecnico: 0,
      costoOficialAdmin: 0,
      comentarioAdmin: "",
      solucion: "",
      clienteAceptoPresupuesto: null,
      fechaCreacion: new Date().toISOString().split('T')[0]
    };

    tickets.push(nuevoTicket);
    localStorage.setItem('sony_tickets', JSON.stringify(tickets));
    this.reset();

    if (esGarantiaVencida) {
      alert("Atención: Tu producto tiene más de 1 año de comprado. Se notificará en tu panel para la aceptación de costos de revisión.");
    }
    cargarTickets();
  };

  if (fileInput.files && fileInput.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) { guardarTicket(e.target.result); };
    reader.readAsDataURL(fileInput.files[0]);
  } else {
    guardarTicket("");
  }
});

function enviarMensajeChat(event, ticketId) {
  event.preventDefault();
  const campoMensaje = document.getElementById(`mensajeChat-${ticketId}`);
  const texto = campoMensaje.value.trim();
  if (!texto) return;

  const tickets = JSON.parse(localStorage.getItem('sony_tickets')) || [];
  const ticket = tickets.find(t => t.id === ticketId && t.clienteId === usuarioSesion.id && t.tecnicoId);
  if (!ticket) {
    alert('No se pudo enviar el mensaje porque el técnico ya no está asignado a esta solicitud.');
    cargarTickets();
    return;
  }

  ticket.mensajesChat = ticket.mensajesChat || [];
  ticket.mensajesChat.push({
    id: Date.now(),
    remitente: 'CLIENTE',
    nombre: `${usuarioSesion.nombres} ${usuarioSesion.apellidos || ''}`.trim(),
    texto,
    fecha: new Date().toISOString()
  });
  localStorage.setItem('sony_tickets', JSON.stringify(tickets));
  cargarTickets();
}

function responderGarantiaVencida(ticketId, acepto) {
  let tickets = JSON.parse(localStorage.getItem('sony_tickets'));
  const ticket = tickets.find(t => t.id === ticketId);
  if (ticket) {
    if (acepto) {
      ticket.clienteAceptoRevisionPago = true;
    } else {
      tickets = tickets.filter(t => t.id !== ticketId);
    }
    localStorage.setItem('sony_tickets', JSON.stringify(tickets));
    cargarTickets();
  }
}

function responderPresupuesto(ticketId, acepto) {
  let tickets = JSON.parse(localStorage.getItem('sony_tickets'));
  const ticket = tickets.find(t => t.id === ticketId);
  if (ticket) {
    ticket.clienteAceptoPresupuesto = acepto;
    ticket.estado = acepto ? 'REPARACION_ACEPTADA' : 'REPARACION_RECHAZADA';
    localStorage.setItem('sony_tickets', JSON.stringify(tickets));
    cargarTickets();
  }
}

function eliminarTicket(id) {
  if (confirm("¿Estás seguro de eliminar esta solicitud?")) {
    let tickets = JSON.parse(localStorage.getItem('sony_tickets')) || [];
    tickets = tickets.filter(t => t.id !== id);
    localStorage.setItem('sony_tickets', JSON.stringify(tickets));
    cargarTickets();
  }
}

function formatearEstado(estado) {
  switch(estado) {
    case 'REGISTRADO': return 'Recepción Registrada';
    case 'EN_REVISION': return 'En Diagnóstico Técnico';
    case 'PENDIENTE_APROBACION_ADMIN': return 'Revisión de Presupuesto por Sony';
    case 'REVISAR_PRECIO_TECNICO': return 'Ajuste de Presupuesto';
    case 'PRESUPUESTO_ENVIADO': return 'Presupuesto Listo (Esperando tu Aprobación)';
    case 'REPARACION_ACEPTADA': return 'Reparación Aceptada (En Proceso)';
    case 'REPARACION_RECHAZADA': return 'Reparación Cancelada';
    case 'RESUELTO': return 'Finalizado y listo para entrega';
    default: return estado;
  }
}

function obtenerBadgeGravedad(g) {
  return g === 'ALTA' ? 'bg-red-100 text-red-800' : (g === 'MEDIA' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800');
}
function obtenerBordeGravedad(g) {
  return g === 'ALTA' ? 'border-red-500' : (g === 'MEDIA' ? 'border-orange-500' : 'border-green-500');
}
function cerrarSesion() { localStorage.removeItem('usuario_sesion'); window.location.href = 'index.html'; }

window.addEventListener('storage', function(event) {
  if (event.key === 'sony_tickets') cargarTickets();
});

cargarTickets();
