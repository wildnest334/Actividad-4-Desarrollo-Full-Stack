const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'tareas.json');
const USERS_FILE = path.join(__dirname, 'usuarios.json');
const SECRET_KEY = 'clave_secreta';

app.use(express.json());

// Servir carpeta frontend completa
app.use(express.static(path.join(__dirname, 'frontend')));

// ------------------------------
// Funciones de manejo de archivos
// ------------------------------
async function obtenerTareas() {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf-8');
        return JSON.parse(data);
    } catch {
        return [];
    }
}

async function guardarTareas(tareas) {
    await fs.writeFile(DATA_FILE, JSON.stringify(tareas, null, 2));
}

async function obtenerUsuarios() {
    try {
        const data = await fs.readFile(USERS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch {
        return [];
    }
}

async function guardarUsuarios(usuarios) {
    await fs.writeFile(USERS_FILE, JSON.stringify(usuarios, null, 2));
}

// ------------------------------
// Middleware de autenticación
// ------------------------------
function autenticarToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Acceso denegado' });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ error: 'Token inválido' });
        req.user = user;
        next();
    });
}

// ------------------------------
// Rutas de usuarios
// ------------------------------
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username y password son obligatorios' });

    const usuarios = await obtenerUsuarios();
    if (usuarios.find(u => u.username === username))
        return res.status(400).json({ error: 'Usuario ya existe' });

    const hashedPassword = await bcrypt.hash(password, 10);
    usuarios.push({ username, password: hashedPassword });
    await guardarUsuarios(usuarios);

    res.status(201).json({ mensaje: 'Usuario registrado exitosamente' });
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username y password son obligatorios' });

    const usuarios = await obtenerUsuarios();
    const usuario = usuarios.find(u => u.username === username);
    if (!usuario) return res.status(400).json({ error: 'Usuario o contraseña incorrectos' });

    const valido = await bcrypt.compare(password, usuario.password);
    if (!valido) return res.status(400).json({ error: 'Usuario o contraseña incorrectos' });

    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ mensaje: 'Login exitoso', token });
});

// ------------------------------
// Rutas de tareas
// ------------------------------
app.get('/tareas', autenticarToken, async (req, res) => {
    const tareas = await obtenerTareas();
    res.json(tareas);
});

app.post('/tareas', autenticarToken, async (req, res) => {
    const { titulo, descripcion } = req.body;
    if (!titulo || !descripcion) return res.status(400).json({ error: 'Titulo y descripción son obligatorios' });

    const tareas = await obtenerTareas();
    const nuevaTarea = { id: Date.now().toString(), titulo, descripcion, estado: 'pendiente' };
    tareas.push(nuevaTarea);
    await guardarTareas(tareas);

    res.status(201).json(nuevaTarea);
});

app.put('/tareas/:id', autenticarToken, async (req, res) => {
    const { id } = req.params;
    const { titulo, descripcion, estado } = req.body;

    const tareas = await obtenerTareas();
    const index = tareas.findIndex(t => t.id === id);
    if (index === -1) return res.status(404).json({ error: 'Tarea no encontrada' });

    tareas[index] = { ...tareas[index], titulo: titulo ?? tareas[index].titulo, descripcion: descripcion ?? tareas[index].descripcion, estado: estado ?? tareas[index].estado };
    await guardarTareas(tareas);

    res.json(tareas[index]);
});

app.delete('/tareas/:id', autenticarToken, async (req, res) => {
    const { id } = req.params;
    const tareas = await obtenerTareas();
    const nuevasTareas = tareas.filter(t => t.id !== id);

    if (tareas.length === nuevasTareas.length) return res.status(404).json({ error: 'Tarea no encontrada' });

    await guardarTareas(nuevasTareas);
    res.json({ mensaje: 'Tarea eliminada correctamente' });
});

// ------------------------------
// Iniciar servidor
// ------------------------------
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
