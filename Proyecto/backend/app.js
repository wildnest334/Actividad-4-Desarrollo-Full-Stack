require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();

// =========================
// 🔹 CONFIGURACIÓN
// =========================

const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET;

// =========================
// 🔹 MIDDLEWARES
// =========================

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// =========================
// 🔹 MODELO USUARIO
// =========================

const usuarioSchema = new mongoose.Schema({
  usuario: { 
    type: String, 
    required: true, 
    unique: true 
  },
  contraseña: { 
    type: String, 
    required: true 
  },
  rol: { 
    type: String, 
    enum: ['normal', 'especial'], 
    default: 'normal' 
  }
});

const Usuario = mongoose.model('Usuario', usuarioSchema);

// =========================
// 🔹 MODELO PRODUCTO
// =========================

const productoSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true
  },
  descripcion: {
    type: String
  },
  precio: {
    type: Number,
    required: true
  },
  stock: {
    type: Number,
    required: true,
    default: 0
  },
  fechaCaducidad: {
    type: Date
  },
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  }
}, { timestamps: true });

const Producto = mongoose.model('Producto', productoSchema);

// =========================
// 🔹 RUTAS DE AUTENTICACIÓN
// =========================

app.post('/api/register', async (req, res) => {
  try {
    const { usuario, contraseña } = req.body;

    if (!usuario || !contraseña) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    const existeUsuario = await Usuario.findOne({ usuario });
    if (existeUsuario) {
      return res.status(400).json({ error: 'El usuario ya existe' });
    }

    const hashedPassword = await bcrypt.hash(contraseña, 10);

    const nuevoUsuario = new Usuario({
      usuario,
      contraseña: hashedPassword
    });

    await nuevoUsuario.save();

    res.status(201).json({ mensaje: 'Usuario registrado correctamente' });

  } catch (error) {
    res.status(500).json({ error: 'Error en el registro' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { usuario, contraseña } = req.body;

    if (!usuario || !contraseña) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    const usuarioEncontrado = await Usuario.findOne({ usuario });
    if (!usuarioEncontrado) {
      return res.status(400).json({ error: 'Credenciales inválidas' });
    }

    const esValida = await bcrypt.compare(contraseña, usuarioEncontrado.contraseña);
    if (!esValida) {
      return res.status(400).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: usuarioEncontrado._id, rol: usuarioEncontrado.rol },
      SECRET_KEY,
      { expiresIn: '2h' }
    );

    res.json({ token });

  } catch (error) {
    res.status(500).json({ error: 'Error en el login' });
  }
});

// =========================
// 🔹 MIDDLEWARE AUTH
// =========================

function auth(req, res, next) {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado' });
  }

  try {
    const verified = jwt.verify(token, SECRET_KEY);
    req.usuario = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Token inválido' });
  }
}

// =========================
// 🔹 RUTAS PRODUCTOS
// =========================

app.post('/api/productos', auth, async (req, res) => {
  try {
    const { nombre, descripcion, precio, stock, fechaCaducidad } = req.body;

    const nuevoProducto = new Producto({
      nombre,
      descripcion,
      precio,
      stock,
      fechaCaducidad,
      usuario: req.usuario.id
    });

    await nuevoProducto.save();

    res.status(201).json(nuevoProducto);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear producto' });
  }
});

app.get('/api/productos', auth, async (req, res) => {
  try {
    const productos = await Producto.find({ usuario: req.usuario.id });
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

app.put('/api/productos/:id', auth, async (req, res) => {
  try {
    const producto = await Producto.findOneAndUpdate(
      { _id: req.params.id, usuario: req.usuario.id },
      req.body,
      { new: true }
    );

    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json(producto);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});

app.delete('/api/productos/:id', auth, async (req, res) => {
  try {
    const producto = await Producto.findOneAndDelete({
      _id: req.params.id,
      usuario: req.usuario.id
    });

    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json({ mensaje: 'Producto eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

// =========================
// 🔹 CONEXIÓN A MONGODB
// =========================

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    if (process.env.NODE_ENV !== 'test') {
      console.log('✅ MongoDB conectado correctamente');
    }
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
  }
}

connectDB();

// =========================
// 🔹 INICIAR SERVIDOR SOLO SI NO ES TEST
// =========================

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  });
}

module.exports = app;
