# Sanatani Community - North South University

Public website + admin panel for the Sanatani Community at NSU. Node.js/Express backend with PostgreSQL and a static HTML frontend.

## Tech Stack

- **Backend:** Node.js, Express 5, PostgreSQL, JWT auth
- **Frontend:** Single-file vanilla HTML/CSS/JS SPA
- **Database:** PostgreSQL (port 5433)

## Setup

```bash
git clone https://github.com/tamalchakrovorty/Sanatani.git
cd Sanatani
cp .env.example .env   # edit with your DB credentials
npm install            # or yarn
node server/seed.js    # seed demo data
node server/index.js   # start on port 3001
```

## Structure

```
server/
  index.js         Express app, API routes
  db.js            PostgreSQL connection
  auth.js          JWT middleware
  migrate.js       Schema migrations
  seed.js          Demo data seeder
  routes/          API route handlers (events, posts, notices, etc.)
  migrations/      SQL migration files
frontend/
  index.html       Complete SPA (CSS + JS inlined)
uploads/           User-uploaded images (gitignored)
```

## API

| Endpoint | Description |
|----------|-------------|
| `GET /api/public/all` | All published content |
| `GET /api/admin/all` | All data (admin, requires JWT) |
| `POST /api/auth/login` | Login → JWT token |
| `GET /api/events` | List events |
| `POST /api/upload` | Upload image (admin) |

## Admin

Navigate to `/#/admin` and sign in with the seeded credentials (see seed.js).
