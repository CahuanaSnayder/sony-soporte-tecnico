function switchTab(tab) {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const tabLoginBtn = document.getElementById('tabLoginBtn');
  const tabRegBtn = document.getElementById('tabRegBtn');

  if (tab === 'login') {
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    tabLoginBtn.className = "w-1/2 py-2 border-b-2 border-red-500 font-bold text-red-500";
    tabRegBtn.className = "w-1/2 py-2 border-b-2 border-transparent text-gray-400 hover:text-white";
  } else {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    tabRegBtn.className = "w-1/2 py-2 border-b-2 border-red-500 font-bold text-red-500";
    tabLoginBtn.className = "w-1/2 py-2 border-b-2 border-transparent text-gray-400 hover:text-white";
  }
}

// Iniciar Sesión
document.getElementById('loginForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const correo = document.getElementById('correo').value.trim();
  const password = document.getElementById('password').value.trim();
  const usuarios = JSON.parse(localStorage.getItem('sony_usuarios')) || [];

  const usuarioEncontrado = usuarios.find(
    u => u.correo.toLowerCase() === correo.toLowerCase() && u.password === password
  );

  if (usuarioEncontrado) {
    localStorage.setItem('usuario_sesion', JSON.stringify(usuarioEncontrado));

    if (usuarioEncontrado.rol === 'CLIENTE') window.location.href = 'cliente.html';
    else if (usuarioEncontrado.rol === 'TECNICO') window.location.href = 'tecnico.html';
    else if (usuarioEncontrado.rol === 'ADMINISTRADOR') window.location.href = 'admin.html';
  } else {
    alert('Correo o contraseña incorrectos.');
  }
});

// Registrar Nuevo Cliente
document.getElementById('registerForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const usuarios = JSON.parse(localStorage.getItem('sony_usuarios')) || [];
  const correo = document.getElementById('regCorreo').value.trim();

  if (usuarios.some(u => u.correo.toLowerCase() === correo.toLowerCase())) {
    alert('Este correo ya está registrado.');
    return;
  }

  const nuevoUsuario = {
    id: Date.now(),
    nombres: document.getElementById('regNombres').value.trim(),
    apellidos: document.getElementById('regApellidos').value.trim(),
    correo: correo,
    password: document.getElementById('regPassword').value.trim(),
    rol: "CLIENTE"
  };

  usuarios.push(nuevoUsuario);
  localStorage.setItem('sony_usuarios', JSON.stringify(usuarios));
  localStorage.setItem('usuario_sesion', JSON.stringify(nuevoUsuario));

  alert('¡Cuenta creada exitosamente!');
  window.location.href = 'cliente.html';
});
