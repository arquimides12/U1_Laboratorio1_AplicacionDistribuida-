# API REST Segura con Node.js, PostgreSQL y Docker 
**Laboratorio 1 - Aplicaciones Distribuidas**

Este proyecto implementa una arquitectura de backend escalable utilizando un **Pool de Conexiones** para optimizar el acceso a datos y **JWT (JSON Web Tokens)** para la protección de recursos. Se utiliza la base de datos **Sakila** sobre PostgreSQL orquestada en **Docker**.

##  Tecnologías Utilizadas
* **Node.js & Express:** Servidor de aplicaciones.
* **PostgreSQL:** Motor de base de datos relacional.
* **Docker:** Virtualización y despliegue de infraestructura.
* **JWT (jsonwebtoken):** Autenticación stateless.
* **pg (node-postgres):** Gestión de Pool de conexiones.

##  Arquitectura del Sistema
El sistema se basa en tres pilares:
1. **Eficiencia:** Configuración de `pg.Pool` con un máximo de 10 conexiones simultáneas para evitar la saturación del motor de base de datos.
2. **Seguridad:** Middleware de autorización que valida el pasaporte digital (JWT) en cada petición protegida.
3. **Portabilidad:** Despliegue mediante contenedores para garantizar que el entorno sea idéntico en cualquier máquina.

##  Instalación y Uso

1. Clonar el repositorio:
   ```bash
   git clone [https://github.com/arquimides12/U1_Laboratorio1_AplicacionDistribuida-.git](https://github.com/arquimides12/U1_Laboratorio1_AplicacionDistribuida-.git)
   ```
2 Instalar dependencias:
 ```bash
npm install
 ```
3. Levantar la base de datos (asegúrate de tener Docker activo):
 ```bash
docker-compose up -d
 ```
4. Iniciar el servidor
```bash
npm start
```
# Pruebas Realizadas

Login: Generación de JWT mediante credenciales seguras.

Búsqueda Dinámica: Filtrado de películas por parámetros (?q=).

Estadísticas en Paralelo: Uso del Pool para ejecutar múltiples consultas concurrentes (Film, Actor, Customer).

Seguridad: Validación de acceso denegado (403 Forbidden) sin token válido.
