// ===============================
// ESTADO
// ===============================
let tareas = [];
let editandoId = null;

// ===============================
// DOM
// ===============================
const form = document.getElementById('download-form');
const nombreInput = document.getElementById('nombre');
const asignadoAInput = document.getElementById('asignadoA');
const fechaCreacionInput = document.getElementById('fechaCreacion');
const cancelBtn = document.getElementById('cancel-btn');
const list = document.getElementById('downloads-list');

// Agregamos botón de logout dinámicamente
const logoutBtn = document.createElement('button');
logoutBtn.textContent = 'Cerrar sesión';
logoutBtn.className = 'btn-logout';
logoutBtn.style.marginBottom = '10px';
document.body.insertBefore(logoutBtn, document.body.firstChild);
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = '/index.html';
});

// ===============================
// STORAGE
// ===============================
function guardarEnStorage() {
    localStorage.setItem('tareas', JSON.stringify(tareas));
    guardarEnJSON(); // <-- ahora también se guarda en JSON
}

function cargarDesdeStorage() {
    tareas = JSON.parse(localStorage.getItem('tareas')) || [];
}

// ===============================
// INIT
// ===============================
function init() {
    cargarDesdeStorage();
    render();
    form.addEventListener('submit', guardarTarea);
    cancelBtn.addEventListener('click', cancelarEdicion);
}

// ===============================
// GUARDAR
// ===============================
function guardarTarea(e) {
    e.preventDefault();

    const nuevaTarea = {
        id: Date.now().toString(),
        nombre: nombreInput.value.trim(),
        asignadoA: asignadoAInput.value.trim(),
        fechaCreacion: fechaCreacionInput.value,
        estado: 'pendiente'
    };

    tareas.push(nuevaTarea);

    guardarEnStorage();
    form.reset();
    render();
}

// ===============================
// GUARDAR EN JSON (backend)
// ===============================
async function guardarEnJSON() {
    const token = localStorage.getItem('token'); // si usas auth

    try {
        // sincronizamos TODO el arreglo de tareas
        for (const t of tareas) {
            const res = await fetch('/api/tareas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token || ''}`
                },
                body: JSON.stringify(t)
            });

            // Redirigir al login si no autorizado
            if (res.status === 401) {
                alert('Tu sesión expiró o no tienes permisos, serás redirigido al login');
                localStorage.removeItem('token');
                window.location.href = '/index.html';
                return;
            }
        }
    } catch (error) {
        console.error('Error al guardar en JSON:', error);
    }
}

// ===============================
// ACTUALIZAR TAREA EN JSON
// ===============================
async function actualizarEnJSON(tarea) {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`/api/tareas/${tarea.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token || ''}`
            },
            body: JSON.stringify(tarea)
        });

        if (res.status === 401) {
            alert('No tienes permisos o tu sesión expiró, serás redirigido al login');
            localStorage.removeItem('token');
            window.location.href = '/index.html';
        }
    } catch (error) {
        console.error('Error al actualizar en JSON:', error);
    }
}

// ===============================
// ELIMINAR TAREA EN JSON
// ===============================
async function eliminarEnJSON(id) {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`/api/tareas/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token || ''}`
            }
        });

        if (res.status === 401) {
            alert('No tienes permisos o tu sesión expiró, serás redirigido al login');
            localStorage.removeItem('token');
            window.location.href = '/index.html';
        }
    } catch (error) {
        console.error('Error al eliminar en JSON:', error);
    }
}

// ===============================
// RENDER
// ===============================
function render() {
    document.getElementById('total-count').textContent = tareas.length;
    list.innerHTML = '';

    if (tareas.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <p>No hay tareas</p>
                <p>Agrega tu primera tarea arriba</p>
            </div>
        `;
        return;
    }

    tareas.forEach(t => {
        const div = document.createElement('div');
        div.className = 'download-item';

        div.innerHTML = `
            <div class="download-content">
                <div class="download-info">
                    <h3 class="download-title">${t.nombre}</h3>
                    <div class="download-meta">
                        <div class="meta-item"><span class="label">Asignado a:</span> ${t.asignadoA}</div>
                        <div class="meta-item"><span class="label">Fecha:</span> ${t.fechaCreacion}</div>
                        <div class="meta-item"><span class="label">Estado:</span> ${t.estado}</div>
                    </div>
                </div>
                <div class="download-actions">
                    <button class="action-btn action-btn-green" onclick="redirigir('${t.id}','completar')">✔</button>
                    <button class="action-btn action-btn-indigo" onclick="redirigir('${t.id}','editar')">✎</button>
                    <button class="action-btn action-btn-red" onclick="redirigir('${t.id}','eliminar')">🗑</button>
                </div>
            </div>
        `;
        list.appendChild(div);
    });
}

// ===============================
// REDIRECCIÓN
// ===============================
function redirigir(id, accion) {
    localStorage.setItem('tareaSeleccionada', id);
    localStorage.setItem('accionPendiente', accion);
    window.location.href = '/index.html'; // Redirige al login si intenta modificar
}

// ===============================
function cancelarEdicion() {
    form.reset();
}

// ===============================
// ACCIONES
// ===============================
function completar(id) {
    const t = tareas.find(t => t.id === id);
    if (!t) return;
    t.estado = 'completada';
    guardarEnStorage();
    actualizarEnJSON(t);
}

function eliminar(id) {
    const index = tareas.findIndex(t => t.id === id);
    if (index === -1) return;
    tareas.splice(index, 1);
    guardarEnStorage();
    eliminarEnJSON(id);
}

function editar(id) {
    const t = tareas.find(t => t.id === id);
    if (!t) return;
    const nuevoNombre = prompt('Nuevo nombre de la tarea', t.nombre);
    if (nuevoNombre) {
        t.nombre = nuevoNombre;
        guardarEnStorage();
        actualizarEnJSON(t);
    }
}

// ===============================
init();
