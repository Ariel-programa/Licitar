# LicitAR

Sistema SaaS para centralizar, monitorear y analizar licitaciones públicas de salud en Argentina.

## Stack

- **Backend:** Django 5 + DRF + Celery + PostgreSQL + Redis
- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS
- **DevOps:** Docker Compose + Nginx

## Inicio rápido

```bash
# 1. Configurar variables de entorno
cp backend/.env.example backend/.env

# 2. Levantar todo con Docker
docker compose up -d --build

# 3. Crear superusuario (primera vez)
docker compose exec backend python manage.py createsuperuser
```

**URLs:**
- Frontend: http://localhost:5173
- API: http://localhost:8000/api/
- Admin: http://localhost:8000/admin/
- Docs API: http://localhost:8000/api/docs/

## Desarrollo local (sin Docker)

```bash
# Backend
cd backend
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver

# Frontend
cd frontend
npm install
npm run dev

# Celery worker
celery -A config.celery worker --loglevel=info
```

## Tests

```bash
cd backend && pytest
cd frontend && npm run test
```

## Estructura

Ver `docs/FOLDER_STRUCTURE.md` para la arquitectura completa.
