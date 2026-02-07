let tareas = [
    {
        id: '1',
        nombre: 'Diseñar interfaz',
        asignadoA: 'Juan Pérez',
        fechaCreacion: '2026-02-01',
        estado: 'pendiente'
    },
    {
        id: '2',
        nombre: 'Documentar proyecto',
        asignadoA: 'María García',
        fechaCreacion: '2026-02-02',
        estado: 'completada'
    }
];

let editandoId = null;

const form = document.getElementById('download-form');
const nombreInput = document.getElementById('nombre');
const asignadoAInput = document.getElementById('asignadoA');
const fechaCreacionInput = document.getElementById('fechaCreacion');
const cancelBtn = document.getElementById('cancel-btn');
const list = document.getElementById('downloads-list');

function init() {
    fechaCreacionInput.value = new Date().toISOString().split('T')[0];
    form.addEventListener('submit', guardarTarea);
    cancelBtn.addEventListener('click', cancelarEdicion);
    render();
}

function guardarTarea(e) {
    e.preventDefault();

    const tarea = {
        nombre: nombreInput.value.trim(),
        asignadoA: asignadoAInput.value.trim(),
        fechaCreacion: fechaCreacionInput.value
    };

    if (editandoId) {
        tareas = tareas.map(t =>
            t.id === editandoId ? { ...t, ...tarea } : t
        );
    } else {
        tareas.unshift({
            id: Date.now().toString(),
            ...tarea,
            estado: 'pendiente'
        });
    }

    limpiarFormulario();
    render();
}

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
                        <div class="meta-item">
                            <span class="label">Asignado a:</span> ${t.asignadoA}
                        </div>
                        <div class="meta-item">
                            <span class="label">Fecha:</span> ${formatearFecha(t.fechaCreacion)}
                        </div>
                    </div>
                </div>
                <div class="download-actions">
                    <button class="action-btn action-btn-green" onclick="completar('${t.id}')">✔</button>
                    <button class="action-btn action-btn-indigo" onclick="editar('${t.id}')">✎</button>
                    <button class="action-btn action-btn-red" onclick="eliminar('${t.id}')">🗑</button>
                </div>
            </div>
        `;
        list.appendChild(div);
    });
}

function completar(id) {
    tareas = tareas.map(t =>
        t.id === id ? { ...t, estado: 'completada' } : t
    );
    render();
}

function editar(id) {
    const t = tareas.find(t => t.id === id);
    editandoId = id;
    nombreInput.value = t.nombre;
    asignadoAInput.value = t.asignadoA;
    fechaCreacionInput.value = t.fechaCreacion;
    cancelBtn.style.display = 'inline-flex';
}

function eliminar(id) {
    tareas = tareas.filter(t => t.id !== id);
    render();
}

function cancelarEdicion() {
    limpiarFormulario();
}

function limpiarFormulario() {
    editandoId = null;
    form.reset();
    fechaCreacionInput.value = new Date().toISOString().split('T')[0];
    cancelBtn.style.display = 'none';
}

function formatearFecha(fecha) {
    return new Date(fecha).toLocaleDateString('es-MX');
}

init();
