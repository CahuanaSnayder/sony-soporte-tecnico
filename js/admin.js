const usuarioSesion = JSON.parse(localStorage.getItem('usuario_sesion'));

if (!usuarioSesion || usuarioSesion.rol !== 'ADMINISTRADOR') {
  window.location.href = 'index.html';
}

function cargarPanelAdmin() {
  const tickets = JSON.parse(localStorage.getItem('sony_tickets')) || [];
  const tbody = document.getElementById('tablaAdmin');

  if (tickets.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-gray-500">No hay tickets registrados.</td></tr>';
    return;
  }

  tbody.innerHTML = tickets.map(ticket => `
        <tr class="hover:bg-gray-50">
            <td class="py-2.5 px-3 font-bold text-red-600">${ticket.codigo}</td>
            <td class="py-2.5 px-3">
                <p class="font-medium">${ticket.producto}</p>
                <p class="text-[10px] text-gray-400">Boleta: ${ticket.numeroBoleta || 'N/A'}</p>
            </td>
            <td class="py-2.5 px-3 font-semibold text-gray-700">${ticket.estado}</td>
            <td class="py-2.5 px-3 font-bold text-blue-900">
                S/. ${ticket.costoPropuestoTecnico || 0}
            </td>
            <td class="py-2.5 px-3 text-center">
                ${ticket.estado === 'PENDIENTE_APROBACION_ADMIN' ? `
                    <div class="flex justify-center gap-1">
                        <button onclick="aprobarPrecio(${ticket.id})" class="bg-green-600 text-white px-2 py-1 rounded text-[11px] font-bold hover:bg-green-700">
                             Aprobar
                        </button>
                        <button onclick="solicitarAjustePrecio(${ticket.id})" class="bg-amber-600 text-white px-2 py-1 rounded text-[11px] font-bold hover:bg-amber-700">
                             Editar / Rechazar
                        </button>
                    </div>
                ` : `<span class="text-gray-400 italic text-[11px]">N/A o Evaluado</span>`}
            </td>
        </tr>
    `).join('');
}

function aprobarPrecio(ticketId) {
  let tickets = JSON.parse(localStorage.getItem('sony_tickets'));
  const ticket = tickets.find(t => t.id === ticketId);
  if (ticket) {
    ticket.costoOficialAdmin = ticket.costoPropuestoTecnico;
    ticket.estado = 'PRESUPUESTO_ENVIADO'; // Se le notifica al cliente
    localStorage.setItem('sony_tickets', JSON.stringify(tickets));
    alert("Presupuesto aprobado y enviado al cliente.");
    cargarPanelAdmin();
  }
}

function solicitarAjustePrecio(ticketId) {
  let tickets = JSON.parse(localStorage.getItem('sony_tickets'));
  const ticket = tickets.find(t => t.id === ticketId);
  if (ticket) {
    const comentario = prompt("Escriba el motivo por el cual rechaza o pide ajustar el precio al técnico:");
    if (comentario) {
      ticket.comentarioAdmin = comentario;
      ticket.estado = 'REVISAR_PRECIO_TECNICO'; // Regresa al técnico
      localStorage.setItem('sony_tickets', JSON.stringify(tickets));
      alert("Observación enviada al técnico.");
      cargarPanelAdmin();
    }
  }
}

document.getElementById('nuevoTecnicoForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const usuarios = JSON.parse(localStorage.getItem('sony_usuarios')) || [];
  const correo = document.getElementById('tecCorreo').value.trim();

  if (usuarios.some(u => u.correo.toLowerCase() === correo.toLowerCase())) {
    alert('Este correo ya está registrado.');
    return;
  }

  const nuevoTecnico = {
    id: Date.now(),
    nombres: document.getElementById('tecNombres').value.trim(),
    apellidos: document.getElementById('tecApellidos').value.trim(),
    correo: correo,
    password: document.getElementById('tecPassword').value.trim(),
    rol: "TECNICO"
  };

  usuarios.push(nuevoTecnico);
  localStorage.setItem('sony_usuarios', JSON.stringify(usuarios));
  alert('¡Técnico registrado!');
  this.reset();
});

function cerrarSesion() { localStorage.removeItem('usuario_sesion'); window.location.href = 'index.html'; }
cargarPanelAdmin();
