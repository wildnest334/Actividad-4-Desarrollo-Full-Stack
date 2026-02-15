const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');

const Usuario = mongoose.model('Usuario');
const Producto = mongoose.model('Producto');

let token = "";
let productoId = "";

beforeAll(async () => {
  await Usuario.deleteMany({});
  await Producto.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("Pruebas API Productos", () => {

  test("Registrar usuario", async () => {
    const res = await request(app)
      .post("/api/register")
      .send({
        usuario: "testuser",
        contraseña: "123456"
      });

    expect(res.statusCode).toBe(201);
  });

  test("Login usuario", async () => {
    const res = await request(app)
      .post("/api/login")
      .send({
        usuario: "testuser",
        contraseña: "123456"
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();

    token = res.body.token;
  });

  test("Crear producto", async () => {
    const res = await request(app)
      .post("/api/productos")
      .set("Authorization", token)
      .send({
        nombre: "Producto Test",
        descripcion: "Descripcion test",
        precio: 100,
        stock: 10,
        fechaCaducidad: "2026-12-31"
      });

    expect(res.statusCode).toBe(201);
    productoId = res.body._id;
  });

  test("Obtener productos", async () => {
    const res = await request(app)
      .get("/api/productos")
      .set("Authorization", token);

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test("Actualizar producto", async () => {
    const res = await request(app)
      .put(`/api/productos/${productoId}`)
      .set("Authorization", token)
      .send({
        nombre: "Producto Editado",
        descripcion: "Nueva descripcion",
        precio: 200,
        stock: 5
      });

    expect(res.statusCode).toBe(200);
  });

  test("Eliminar producto", async () => {
    const res = await request(app)
      .delete(`/api/productos/${productoId}`)
      .set("Authorization", token);

    expect(res.statusCode).toBe(200);
  });

});
