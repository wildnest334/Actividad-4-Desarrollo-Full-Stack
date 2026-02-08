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
    try { 
        return JSON.parse(await fs.readFile(file, 'utf-8')); 
    } catch { 
        return []; 
    }
};

const escribir = async (file, data) =>
    fs.writeFile(file, JSON.stringify(data, null, 2));

// ================= AUTH =================
function auth(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return next(Object.assign(new Error('Acceso denegado'), { status: 401 }));

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return next(Object.assign(new Error('Token inválido'), { status: 403 }));
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
app.get('/tareas.html', auth, (req, res, next) => {
    try {
        if (req.user.rol !== 'especial') throw Object.assign(new Error('No tienes permisos'), { status: 403 });
        res.sendFile(path.join(__dirname, 'frontend', 'tareas.html'));
    } catch (err) {
        next(err);
    }
});

// ================= REGISTER =================
app.post('/register', async (req, res, next) => {
    try {
        const { username, password } = req.body;
        const usuarios = await leer(USERS_FILE);

        if (usuarios.find(u => u.username === username))
            throw Object.assign(new Error('Usuario ya existe'), { status: 400 });

        const hash = await bcrypt.hash(password, 10);
        usuarios.push({ username, password: hash });
        await escribir(USERS_FILE, usuarios);

        const token = jwt.sign({ username, rol: 'normal' }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ token, redirect: '/administrador.html' });
    } catch (err) {
        next(err);
    }
});

// ================= LOGIN =================
app.post('/login', async (req, res, next) => {
    try {
        const { username, password } = req.body;

        const especial = usuariosEspeciales.find(u => u.username === username);
        if (especial) {
            const valid = await bcrypt.compare(password, await bcrypt.hash(especial.password, 10));
            if (!valid) throw Object.assign(new Error('Contraseña incorrecta'), { status: 400 });

            const token = jwt.sign({ username, rol: 'especial' }, SECRET_KEY, { expiresIn: '1h' });
            return res.json({ token, redirect: '/tareas.html' });
        }

        const usuarios = await leer(USERS_FILE);
        const user = usuarios.find(u => u.username === username);
        if (!user) throw Object.assign(new Error('Usuario no registrado'), { status: 400 });

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) throw Object.assign(new Error('Contraseña incorrecta'), { status: 400 });

        const token = jwt.sign({ username, rol: 'normal' }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ token, redirect: '/administrador.html' });
    } catch (err) {
        next(err);
    }
});

// ================= API TAREAS =================
app.get('/api/tareas', auth, async (req, res, next) => {
    try {
        const tareas = await leer(DATA_FILE);
        res.json(tareas);
    } catch (err) {
        next(err);
    }
});

app.post('/api/tareas', auth, async (req, res, next) => {
    try {
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
    } catch (err) {
        next(err);
    }
});

app.put('/api/tareas/:id', auth, async (req, res, next) => {
    try {
        if (req.user.rol !== 'especial') throw Object.assign(new Error('No tienes permisos'), { status: 403 });

        const tareas = await leer(DATA_FILE);
        const t = tareas.find(t => t.id === req.params.id);
        if (!t) throw Object.assign(new Error('Tarea no encontrada'), { status: 404 });

        Object.assign(t, req.body);
        await escribir(DATA_FILE, tareas);
        res.json(t);
    } catch (err) {
        next(err);
    }
});

app.delete('/api/tareas/:id', auth, async (req, res, next) => {
    try {
        if (req.user.rol !== 'especial') throw Object.assign(new Error('No tienes permisos'), { status: 403 });

        let tareas = await leer(DATA_FILE);
        tareas = tareas.filter(t => t.id !== req.params.id);
        await escribir(DATA_FILE, tareas);
        res.json({ ok: true });
    } catch (err) {
        next(err);
    }
});

// ================= ERROR HANDLER =================
app.use((err, req, res, next) => {
    console.error('Error capturado:', err.stack || err);
    const status = err.status || 500;
    const message = err.message || 'Error interno del servidor';
    res.status(status).json({ error: message });
});

// ================= LISTEN =================
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
