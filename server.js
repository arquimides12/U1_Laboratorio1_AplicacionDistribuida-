// ==============================================
// SERVIDOR COMPLETO: JWT + POOL DE CONEXIONES + SAKILA (POSTGRES)
// ==============================================
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg'); // Usamos pg para Postgres

const app = express();
const PORT = 3000;

app.use(express.json());

// ==============================================
// PASO 1: CREAR EL POOL DE CONEXIONES
// ==============================================
const pool = new Pool({
    user: 'postgres',
    host: '127.0.0.1',
    database: 'sakila',
    password: '1234', // Tu contraseña
    port: 5433,       // Tu puerto
    max: 10,
    idleTimeoutMillis: 30000,
});

// Para mantener la sintaxis de la guía (poolPromise.query)
const poolPromise = {
    query: (text, params) => pool.query(text, params)
};

async function probarConexion() {
    try {
        await poolPromise.query('SELECT 1 + 1 AS resultado');
        console.log('Conexión con base de datos OK!');
    } catch (error) {
        console.error(' Error de conexión:', error.message);
        process.exit(1);
    }
}
probarConexion();

const CLAVE_SECRETA = 'mi-clave-super-secreta-2024';

// ==============================================
// RUTA 1: LOGIN (Autenticación)
// ==============================================
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ mensaje: 'Faltan email o contraseña' });

        const result = await poolPromise.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        const usuarios = result.rows;

        if (usuarios.length === 0) return res.status(401).json({ mensaje: 'Email o contraseña incorrectos' });

        const usuario = usuarios[0];
        // Nota: Si usas bcrypt en producción, usa bcrypt.compare. Aquí comparamos directo según tu lab.
        if (password !== usuario.password) {
            return res.status(401).json({ mensaje: 'Email o contraseña incorrectos' });
        }

        const token = jwt.sign(
            { id: usuario.id, email: usuario.email },
            CLAVE_SECRETA,
            { expiresIn: '2h' }
        );

        res.json({ mensaje: '¡Login exitoso!', token, usuario: { id: usuario.id, email: usuario.email } });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
});

// ==============================================
// MIDDLEWARE: VERIFICAR TOKEN (El Guardia)
// ==============================================
const verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(403).json({ mensaje: 'No enviaste token.' });

    const token = authHeader.split(' ')[1];
    try {
        const datos = jwt.verify(token, CLAVE_SECRETA);
        req.usuario = datos;
        next();
    } catch (error) {
        return res.status(401).json({ mensaje: 'Token inválido o expirado.' });
    }
};

// ==============================================
// RUTA 2: OBTENER TODAS LAS PELÍCULAS (Muestra Academy Dinosaur)
// ==============================================
app.get('/peliculas', verificarToken, async (req, res) => {
    try {
        // Probamos con "film" entre comillas si el error persiste
        const result = await poolPromise.query('SELECT * FROM "film" LIMIT 10');
        
        res.json({
            mensaje: `Bienvenido ${req.usuario.email}`,
            total_peliculas: result.rows.length,
            peliculas: result.rows
        });
    } catch (error) {
        // Esto imprimirá el error real en tu terminal de VS Code
        console.error("Error en DB:", error); 
        res.status(500).json({ error: error.message });
    }
});

// ==============================================
// RUTA 3: BUSCAR PELÍCULA POR ID
// ==============================================
app.get('/peliculas/:id', verificarToken, async (req, res) => {
    try {
        const id = req.params.id;
        const result = await poolPromise.query('SELECT * FROM public.film WHERE film_id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ mensaje: 'Película no encontrada' });
        res.json({ mensaje: 'Película encontrada', pelicula: result.rows[0] });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al buscar película' });
    }
});

// ==============================================
// RUTA 4: BUSCAR POR TÍTULO (Query Params)
// ==============================================
app.get('/buscar-peliculas', verificarToken, async (req, res) => {
    try {
        const q = req.query.q || '';
        if (q.length < 2) return res.status(400).json({ mensaje: 'Escribe al menos 2 letras' });
        const result = await poolPromise.query('SELECT film_id, title FROM public.film WHERE title ILIKE $1 LIMIT 20', [`%${q}%`]);
        res.json({ busqueda: q, resultados: result.rows.length, peliculas: result.rows });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error en búsqueda' });
    }
});

// ==============================================
// RUTA 5: ESTADÍSTICAS (Múltiples consultas)
// ==============================================
app.get('/estadisticas', verificarToken, async (req, res) => {
    try {
        const peliCount = await poolPromise.query('SELECT COUNT(*) FROM public.film');
        const actorCount = await poolPromise.query('SELECT COUNT(*) FROM public.actor');
        const custCount = await poolPromise.query('SELECT COUNT(*) FROM public.customer');

        res.json({
            mensaje: 'Estadísticas de Sakila',
            total_peliculas: peliCount.rows[0].count,
            total_actores: actorCount.rows[0].count,
            total_clientes: custCount.rows[0].count,
            usuario: req.usuario.email
        });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error en estadísticas' });
    }
});

// ==============================================
// RUTA 6: LOGOUT
// ==============================================
app.post('/logout', verificarToken, (req, res) => {
    res.json({ mensaje: '¡Has cerrado sesión! Borra el token de tu almacenamiento local.' });
});

app.listen(PORT, () => {
    console.log(` Servidor corriendo en http://localhost:${PORT}`);
});