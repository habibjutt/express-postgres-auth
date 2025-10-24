# Express Postgres Auth

A minimal Express + PostgreSQL example demonstrating user authentication with JSON Web Tokens (JWT). The app uses EJS templates for views and stores the JWT in a cookie for authentication of protected routes.

Key points
- Authentication: register + login endpoints. Passwords hashed with bcrypt.
- Authorization: JWTs signed with `JWT_SECRET` and stored in an HTTP cookie named `token`.
- Database: PostgreSQL (containerized via docker-compose).

Requirements
- Docker & Docker Compose (recommended)
- Node.js (if running locally without Docker)

Environment
Create a `.env` in the project root (or use `.env.example`) and set the following variables:

```
DB_HOST=db
DB_USER=postgres
DB_PASSWORD=your_db_password
DB_NAME=auth_db
DB_PORT=5432
PORT=3000
JWT_SECRET=your_jwt_secret_here
PG_ADMIN=admin@example.com
PG_ADMIN_PASSWORD=adminpw
```

Run (Docker)
1. Build and start the services:

```bash
docker compose up -d --build
```

2. Follow logs (optional):

```bash
docker compose logs -f app
```

Run (Local / non-Docker)
1. Install dependencies:

```bash
npm install
```

2. Start:

```bash
npm start
```

Endpoints
- GET / — home (reads `token` cookie and shows login state)
- GET /register — registration page
- POST /register — register { email, password }
- GET /login — login page
- POST /login — login { email, password } (returns cookie `token`)
- GET /profile — protected route, requires valid JWT cookie
- GET /logout — clears the token cookie

How JWT is used
- On successful login the server signs a JWT with `JWT_SECRET` and sets it as a cookie named `token`.
- Protected routes use a `verifyToken` middleware which reads `req.cookies.token` and verifies it with `JWT_SECRET`.

Troubleshooting
- MODULE_NOT_FOUND: express-ejs-layouts
  - Ensure dependencies are installed inside the container image. Rebuild the image after changing `package.json`:

  ```bash
  docker compose build --no-cache app
  docker compose up -d app
  ```

  Or install locally and restart:

  ```bash
  npm install express-ejs-layouts --save
  npm start
  ```

- Postgres data/version errors (e.g. "in 18+, these Docker images are configured to store database data in a format...")
  - This means the `pgdata` volume was initialized by a different Postgres major version than the image currently configured.
  - If the data is important: start a container using the Postgres major version that matches the volume, dump the data (`pg_dumpall`) and restore to a fresh volume.
  - If the data is not needed: stop compose and remove the volume, then restart:

  ```bash
  docker compose down
  docker volume rm pgdata
  docker compose up -d --build
  ```

Security notes
- Do not commit `.env` to source control. Add it to `.gitignore`.
- Use a strong `JWT_SECRET` and HTTPS in production (so cookies are secure).

Further improvements
- Add CSRF protection for state-changing requests.
- Use secure cookie flags (Secure, HttpOnly, SameSite) when serving over TLS.
- Add refresh tokens or short-lived access tokens with a refresh flow for better security.

License
MIT
