// server.js
const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'tareas.json');
const USERS_FILE = path.join(__dirname, 'usuarios.json');
const SECRET_KEY = 'clave_secreta';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));

// ================= FILES =================
const leer = async (file) => {
    try { return JSON.parse(await fs.readFile(file, 'utf-8')); }
    catch { return []; }
};

const escribir = async (file, data) =>
    fs.writeFile(file, JSON.stringify(data, null, 2));

// ================= AUTH =================
function auth(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Acceso denegado' });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ error: 'Token inválido' });
        req.user = user;
        next();
    });
}

// ================= USUARIOS ESPECIALES =================
const usuariosEspeciales = [
    { username: 'arielo', password: '1234' },
    { username: 'yaromi', password: 'pipe' },
    { username: 'luis', password: 'hulk' }
];

// ================= HTML =================
app.get('/', (_, res) => res.redirect('/index.html'));
app.get('/index.html', (_, res) => res.sendFile(path.join(__dirname, 'frontend', 'index.html')));
app.get('/register', (_, res) => res.sendFile(path.join(__dirname, 'frontend', 'register.html')));
app.get('/administrador.html', auth, (_, res) => res.sendFile(path.join(__dirname, 'frontend', 'administrador.html')));
app.get('/tareas.html', auth, (req, res) => {
    if (req.user.rol !== 'especial') return res.status(403).send('No tienes permisos');
    res.sendFile(path.join(__dirname, 'frontend', 'tareas.html'));
});

// ================= REGISTER =================
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const usuarios = await leer(USERS_FILE);

    if (usuarios.find(u => u.username === username))
        return res.status(400).json({ error: 'Usuario ya existe' });

    const hash = await bcrypt.hash(password, 10);
    usuarios.push({ username, password: hash });
    await escribir(USERS_FILE, usuarios);

    // Crear token para la sesión
    const token = jwt.sign({ username, rol: 'normal' }, SECRET_KEY, { expiresIn: '1h' });

    // Responder con la ruta a la que debe redirigir el frontend
    res.json({ token, redirect: '/administrador.html' });
});

// ================= LOGIN =================
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // Revisamos si es usuario especial
    const especial = usuariosEspeciales.find(u => u.username === username);
    if (especial) {
        const valid = await bcrypt.compare(password, await bcrypt.hash(especial.password, 10));
        if (!valid) return res.status(400).json({ error: 'Contraseña incorrecta' });

        const token = jwt.sign({ username, rol: 'especial' }, SECRET_KEY, { expiresIn: '1h' });
        return res.json({ token, redirect: '/tareas.html' });
    }

    // Usuarios normales registrados
    const usuarios = await leer(USERS_FILE);
    const user = usuarios.find(u => u.username === username);
    if (!user) return res.status(400).json({ error: 'Usuario no registrado' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: 'Contraseña incorrecta' });

    const token = jwt.sign({ username, rol: 'normal' }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token, redirect: '/administrador.html' });
});

// ================= API TAREAS =================
app.get('/api/tareas', auth, async (_, res) => {
    res.json(await leer(DATA_FILE));
});

app.post('/api/tareas', auth, async (req, res) => {
    const tareas = await leer(DATA_FILE);
    const nueva = {
        id: req.body.id || Date.now().toString(),
        nombre: req.body.nombre,
        asignadoA: req.body.asignadoA,
        fechaCreacion: req.body.fechaCreacion,
        estado: req.body.estado || 'pendiente'
    };
    tareas.push(nueva);
    await escribir(DATA_FILE, tareas);
    res.json(nueva);
});

app.put('/api/tareas/:id', auth, async (req, res) => {
    if (req.user.rol !== 'especial') return res.status(403).json({ error: 'No tienes permisos' });

    const tareas = await leer(DATA_FILE);
    const t = tareas.find(t => t.id === req.params.id);
    if (!t) return res.status(404).json({ error: 'Tarea no encontrada' });

    Object.assign(t, req.body);
    await escribir(DATA_FILE, tareas);
    res.json(t);
});

app.delete('/api/tareas/:id', auth, async (req, res) => {
    if (req.user.rol !== 'especial') return res.status(403).json({ error: 'No tienes permisos' });

    let tareas = await leer(DATA_FILE);
    tareas = tareas.filter(t => t.id !== req.params.id);
    await escribir(DATA_FILE, tareas);
    res.json({ ok: true });
});

// Editar tarea (solo usuarios especiales)
app.put('/api/tareas/:id', auth, async (req, res) => {
    if (req.user.rol !== 'especial') 
        return res.status(401).json({ error: 'No tienes permisos, redirigiendo al login' });

    const tareas = await leer(DATA_FILE);
    const t = tareas.find(t => t.id === req.params.id);
    if (!t) return res.status(404).json({ error: 'Tarea no encontrada' });

    Object.assign(t, req.body);
    await escribir(DATA_FILE, tareas);
    res.json(t);
});

// Eliminar tarea (solo usuarios especiales)
app.delete('/api/tareas/:id', auth, async (req, res) => {
    if (req.user.rol !== 'especial') 
        return res.status(401).json({ error: 'No tienes permisos, redirigiendo al login' });

    let tareas = await leer(DATA_FILE);
    tareas = tareas.filter(t => t.id !== req.params.id);
    await escribir(DATA_FILE, tareas);
    res.json({ ok: true });
});

app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
