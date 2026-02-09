# Proyecto: API de Gestión de Tareas

Este proyecto es una **API REST** desarrollada con **Node.js** y **Express**, que permite gestionar tareas con operaciones CRUD (Crear, Leer, Actualizar, Eliminar). Además, cuenta con **autenticación JWT**, manejo seguro de usuarios con **bcryptjs**, y protección de rutas según el tipo de usuario. Nota importante, y escrito de forma simple, para entrar e iniciar el servidor es necesario acceder a la carpeta de Proyecto en la terminal usando "cd Proyecto" y luego entrando a la carpeta de backend usando "cd backend" y una vez dentro ya se puede iniciar el servidor usando node server.js

---

## **Estructura del proyecto**

Proyecto/
├─ backend/
│ ├─ server.js # Archivo principal del servidor
│ ├─ tareas.json # Archivo que almacena las tareas
│ └─ usuarios.json # Archivo que almacena los usuarios
├─ frontend/
│ ├─ index.html # Pantalla principal y login
│ ├─ tareas.html # Pantalla de gestión de tareas (CRUD)
│ └─ styles.css # Estilos del frontend
└─ README.md


Copiar código

---

## **Requisitos**

- Node.js instalado
- Navegador web
- Opcional: Postman para probar la API

---

## **Instalación y ejecución**

1. Abre una terminal o consola.
2. Navega hasta la carpeta del proyecto:

```bash

cd Proyecto
Entra en la carpeta del backend:

bash
Copiar código
cd backend
Instala las dependencias:

bash
Copiar código
npm install
Inicia el servidor:

bash
Copiar código
node server.js
El servidor estará corriendo en: http://localhost:3000

Abre tu navegador y prueba las pantallas:

Login / Index: http://localhost:3000/index.html

Registro de usuarios: http://localhost:3000/register

Gestión de tareas (usuarios especiales): http://localhost:3000/tareas.html

Administración de usuarios normales: http://localhost:3000/administrador.html

Funcionamiento de la API
La API permite:

Autenticación
POST /login: Recibe username y password. Devuelve un token JWT para acceder a rutas protegidas.

POST /register: Permite registrar nuevos usuarios normales y genera su token JWT.

Rutas de tareas
GET /api/tareas: Obtiene todas las tareas (requiere token).

POST /api/tareas: Crea una nueva tarea (requiere token).

PUT /api/tareas/:id: Actualiza una tarea específica (solo usuarios especiales).

DELETE /api/tareas/:id: Elimina una tarea específica (solo usuarios especiales).

Protección de rutas
Las rutas CRUD requieren token JWT.

Solo los usuarios especiales pueden modificar o eliminar tareas.

Si un usuario no autorizado intenta acceder, la API devuelve 401 (No autorizado) o 403 (Prohibido).

Notas finales
Todas las tareas se almacenan en tareas.json.

Los usuarios registrados se guardan en usuarios.json.

La API funciona de forma asíncrona usando fs.promises para no bloquear el servidor.

Se recomienda usar un navegador y Postman para probar todas las rutas y la autenticación.

