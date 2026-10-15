function initMockData() {
  if (!localStorage.getItem('sony_usuarios')) {
    const usuarios = [
      { id: 1, nombres: "Juan", apellidos: "Pérez", correo: "cliente@sony.com", password: "cliente123", rol: "CLIENTE" },
      { id: 2, nombres: "Carlos", apellidos: "Gómez", correo: "tecnico@sony.com", password: "tecnico123", rol: "TECNICO" },
      { id: 3, nombres: "Ana", apellidos: "Martínez", correo: "admin@sony.com", password: "admin123", rol: "ADMINISTRADOR" }
    ];
    localStorage.setItem('sony_usuarios', JSON.stringify(usuarios));
  }

  if (!localStorage.getItem('sony_tickets')) {
    const tickets = [
      {
        id: 1,
        codigo: "TCK-2026-8801",
        producto: "PlayStation 5",
        numeroSerie: "PS5-992120",
        numeroBoleta: "B001-004521",
        fechaCompra: "2024-01-15",
        garantiamVencida: true,
        clienteAceptoRevisionPago: true,
        categoria: "Consolas / Gaming",
        descripcionFalla: "La consola no enciende, humeó un poco al conectarla.",
        evidenciaImg: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=500&auto=format&fit=crop&q=60",
        estado: "PENDIENTE_APROBACION_ADMIN", // REGISTRADO, EN_REVISION, PENDIENTE_APROBACION_ADMIN, REVISAR_PRECIO_TECNICO, PRESUPUESTO_ENVIADO, REPARACION_ACEPTADA, REPARACION_RECHAZADA, RESUELTO
        gravedad: "ALTA",
        tiempoEstimadoDias: 5,
        clienteId: 1,
        tecnicoId: 2,
        diagnostico: "Fallo en la fuente de poder interna por sobrevoltaje.",
        aplicaGarantia: false,
        costoPropuestoTecnico: 250,
        costoOficialAdmin: 250,
        comentarioAdmin: "",
        solucion: "",
        clienteAceptoPresupuesto: null,
        fechaCreacion: "2026-10-01"
      }
    ];
    localStorage.setItem('sony_tickets', JSON.stringify(tickets));
  }
}

initMockData();
