const usuarioSesion = JSON.parse(localStorage.getItem('usuario_sesion'));

if (!usuarioSesion || usuarioSesion.rol !== 'TECNICO') {
  window.location.href = 'index.html';
}

let ticketSeleccionadoId = null;
let funcionConfirmarModal = null;

function cargarTicketsTecnico() {
  const tickets = JSON.parse(localStorage.getItem('sony_tickets')) || [];
  const filtroG = document.getElementById('filtroGravedad').value;
  const filtroTexto = document.getElementById('buscadorTecnico').value.toLowerCase();
  const contenedor = document.getElementById('tablaTickets');

  let filtrados = tickets.filter(t => {
    const coincideGravedad = (filtroG === 'TODAS' || t.gravedad === filtroG);
    const coincideTexto = t.codigo.toLowerCase().includes(filtroTexto) || t.producto.toLowerCase().includes(filtroTexto);
    return coincideGravedad && coincideTexto;
  });

  if (filtrados.length === 0) {
    contenedor.innerHTML = '<p class="text-gray-500 text-sm py-4">No se encontraron tickets asignados.</p>';
    return;
  }

  contenedor.innerHTML = filtrados.map(ticket => `
        <div class="bg-white p-6 rounded-xl shadow border border-gray-200 border-l-4 ${ticket.gravedad === 'ALTA' ? 'border-red-500' : 'border-orange-500'}">
            <div class="flex justify-between items-start mb-2">
                <div>
                    <span class="text-xs font-bold text-red-600">${ticket.codigo}</span>
                    <h3 class="text-lg font-bold text-gray-900 mt-1">${ticket.producto}</h3>
                    <p class="text-xs text-gray-500">Boleta: ${ticket.numeroBoleta || 'N/A'} | Compra: ${ticket.fechaCompra || 'N/A'}</p>
                </div>
                <span class="text-xs font-bold bg-gray-100 px-2.5 py-1 rounded">
                    ${ticket.estado}
                </span>
            </div>

            ${ticket.estado === 'REVISAR_PRECIO_TECNICO' ? `
                <div class="bg-amber-50 border-l-4 border-amber-500 p-3 rounded text-xs text-amber-900 my-2">
                    <strong class="font-bold"> Observación del Administrador:</strong>
                    <p>"${ticket.comentarioAdmin}"</p>
                </div>
            ` : ''}

            <div class="bg-gray-50 p-3 rounded text-xs text-gray-700 mb-3">
                <strong>Falla reportada:</strong> ${ticket.descripcionFalla}
            </div>

            ${ticket.tecnicoId === usuarioSesion.id ? `
                <section class="border border-gray-200 rounded-lg p-3 mb-3" aria-label="Chat con el cliente">
                    <h4 class="text-sm font-bold text-gray-800 mb-2">Chat con el cliente</h4>
                    <div class="space-y-2 max-h-56 overflow-y-auto mb-3" aria-live="polite">
                        ${(ticket.mensajesChat || []).length ? ticket.mensajesChat.map(mensaje => `
                            <div class="rounded p-2 text-xs ${mensaje.remitente === 'TECNICO' ? 'bg-blue-50 ml-4' : 'bg-red-50 mr-4'}">
                                <div class="flex justify-between gap-2 text-gray-500 mb-1">
                                    <strong>${escaparHTML(mensaje.nombre)}</strong>
                                    <time>${escaparHTML(new Date(mensaje.fecha).toLocaleString('es-PE'))}</time>
                                </div>
                                <p class="text-gray-800 whitespace-pre-wrap break-words">${escaparHTML(mensaje.texto)}</p>
                            </div>
                        `).join('') : '<p class="text-xs text-gray-500">Aún no hay mensajes.</p>'}
                    </div>
                    <form onsubmit="enviarMensajeChat(event, ${ticket.id})" class="flex gap-2">
                        <label for="mensajeChat-${ticket.id}" class="sr-only">Escribe un mensaje al cliente</label>
                        <input id="mensajeChat-${ticket.id}" type="text" maxlength="1000" required
                               class="min-w-0 flex-1 border rounded px-3 py-2 text-sm"
                               placeholder="Escribe un mensaje...">
                        <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-semibold">
                            Enviar
                        </button>
                    </form>
                </section>
            ` : ''}

            ${ticket.diagnostico ? `
                <div class="bg-blue-50 p-3 rounded text-xs text-blue-900 mb-3 space-y-1">
                    <p><strong>Diagnóstico:</strong> ${ticket.diagnostico}</p>
                    <p><strong>Costo Propuesto:</strong> S/. ${ticket.costoPropuestoTecnico}</p>
                </div>
            ` : ''}

            <div class="pt-2 border-t flex gap-2">
                ${ticket.estado === 'REGISTRADO' ? `
                    <button onclick="asignarmeTicket(${ticket.id})" class="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-700 transition">
                        Tomar Orden y Revisar
                    </button>
                ` : ''}

                ${(ticket.estado === 'EN_REVISION' || ticket.estado === 'REVISAR_PRECIO_TECNICO') ? `
                    <button onclick="abrirModalPresupuesto(${ticket.id})" class="bg-purple-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-purple-700 transition">
                         Registrar / Modificar Presupuesto
                    </button>
                ` : ''}

                ${ticket.estado === 'REPARACION_ACEPTADA' ? `
                    <button onclick="abrirModalFinalizar(${ticket.id})" class="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-green-700 transition">
                        ️ Finalizar Reparación
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function escaparHTML(valor) {
  return String(valor).replace(/[&<>"']/g, caracter => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[caracter]);
}

function enviarMensajeChat(event, ticketId) {
  event.preventDefault();
  const campoMensaje = document.getElementById(`mensajeChat-${ticketId}`);
  const texto = campoMensaje.value.trim();
  if (!texto) return;

  const tickets = JSON.parse(localStorage.getItem('sony_tickets')) || [];
  const ticket = tickets.find(t => t.id === ticketId && t.tecnicoId === usuarioSesion.id);
  if (!ticket) {
    alert('No se pudo enviar el mensaje porque esta solicitud ya no está asignada a tu usuario.');
    cargarTicketsTecnico();
    return;
  }

  ticket.mensajesChat = ticket.mensajesChat || [];
  ticket.mensajesChat.push({
    id: Date.now(),
    remitente: 'TECNICO',
    nombre: `${usuarioSesion.nombres} ${usuarioSesion.apellidos || ''}`.trim(),
    texto,
    fecha: new Date().toISOString()
  });
  localStorage.setItem('sony_tickets', JSON.stringify(tickets));
  cargarTicketsTecnico();
}

// 🛠️ MODAL DE REGISTRO DE PRESUPUESTO
function abrirModalPresupuesto(id) {
  ticketSeleccionadoId = id;
  const tickets = JSON.parse(localStorage.getItem('sony_tickets'));
  const ticket = tickets.find(t => t.id === id);

  document.getElementById('modalTitulo').innerHTML = ' Dictamen Técnico y Presupuesto';
  document.getElementById('modalMensaje').innerText = 'Ingresa el análisis de la falla y la propuesta de costo para ser enviada al administrador.';
  document.getElementById('labelInputModal').innerText = 'Diagnóstico Técnico del Equipo:';
  document.getElementById('inputTextoModal').value = ticket.diagnostico || '';

  document.getElementById('contenedorCosto').classList.remove('hidden');
  document.getElementById('contenedorGarantia').classList.remove('hidden');
  document.getElementById('inputCostoModal').value = ticket.costoPropuestoTecnico || 0;
  document.getElementById('checkGarantiaModal').checked = ticket.aplicaGarantia || false;

  const btn = document.getElementById('btnAccionModal');
  btn.innerText = 'Enviar Presupuesto a Sony Admin';
  btn.className = 'px-4 py-2 rounded-lg text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition shadow';

  funcionConfirmarModal = ejecutarEnviarPresupuesto;
  document.getElementById('modalDinamico').classList.remove('hidden');
}

function ejecutarEnviarPresupuesto() {
  const diag = document.getElementById('inputTextoModal').value.trim();
  const costo = parseFloat(document.getElementById('inputCostoModal').value) || 0;
  const aplicaGarantia = document.getElementById('checkGarantiaModal').checked;

  if (!diag) {
    alert('Por favor, ingresa una descripción del diagnóstico.');
    return;
  }

  let tickets = JSON.parse(localStorage.getItem('sony_tickets'));
  const ticket = tickets.find(t => t.id === ticketSeleccionadoId);

  if (ticket) {
    ticket.diagnostico = diag;
    ticket.costoPropuestoTecnico = aplicaGarantia ? 0 : costo;
    ticket.aplicaGarantia = aplicaGarantia;
    ticket.estado = 'PENDIENTE_APROBACION_ADMIN';
    localStorage.setItem('sony_tickets', JSON.stringify(tickets));
    cerrarModalDinamico();
    cargarTicketsTecnico();
  }
}

//  MODAL DE FINALIZACIÓN DE REPARACIÓN (Como en la foto)
function abrirModalFinalizar(id) {
  ticketSeleccionadoId = id;
  const tickets = JSON.parse(localStorage.getItem('sony_tickets'));
  const ticket = tickets.find(t => t.id === id);

  document.getElementById('modalTitulo').innerHTML = '🛠️ Conclusión del Servicio Técnico';
  document.getElementById('modalMensaje').innerText = 'Describe las tareas realizadas y piezas cambiadas en el producto para cerrar el ticket.';
  document.getElementById('labelInputModal').innerText = 'Detalle de la Solución Aplicada:';
  document.getElementById('inputTextoModal').value = ticket.solucion || '';

  document.getElementById('contenedorCosto').classList.add('hidden');
  document.getElementById('contenedorGarantia').classList.add('hidden');

  const btn = document.getElementById('btnAccionModal');
  btn.innerText = 'Guardar Solución y Finalizar';
  btn.className = 'px-4 py-2 rounded-lg text-xs font-bold text-white bg-green-600 hover:bg-green-700 transition shadow';

  funcionConfirmarModal = ejecutarFinalizarReparacion;
  document.getElementById('modalDinamico').classList.remove('hidden');
}

function ejecutarFinalizarReparacion() {
  const solucionText = document.getElementById('inputTextoModal').value.trim();
  if (!solucionText) {
    alert('Por favor ingresa los detalles de la solución aplicada.');
    return;
  }

  let tickets = JSON.parse(localStorage.getItem('sony_tickets'));
  const ticket = tickets.find(t => t.id === ticketSeleccionadoId);
  if (ticket) {
    ticket.solucion = solucionText;
    ticket.estado = 'RESUELTO';
    localStorage.setItem('sony_tickets', JSON.stringify(tickets));
    cerrarModalDinamico();
    cargarTicketsTecnico();
  }
}

function asignarmeTicket(id) {
  let tickets = JSON.parse(localStorage.getItem('sony_tickets'));
  const ticket = tickets.find(t => t.id === id);
  if (ticket) {
    ticket.estado = 'EN_REVISION';
    ticket.tecnicoId = usuarioSesion.id;
    localStorage.setItem('sony_tickets', JSON.stringify(tickets));
    cargarTicketsTecnico();
  }
}

function cerrarModalDinamico() {
  document.getElementById('modalDinamico').classList.add('hidden');
}

document.getElementById('btnAccionModal').onclick = function() {
  if (funcionConfirmarModal) funcionConfirmarModal();
};

function cerrarSesion() { localStorage.removeItem('usuario_sesion'); window.location.href = 'index.html'; }
window.addEventListener('storage', function(event) {
  if (event.key === 'sony_tickets') cargarTicketsTecnico();
});

cargarTicketsTecnico();
