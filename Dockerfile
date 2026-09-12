FROM node:20-alpine

WORKDIR /app

# Copy package files for frontend and backend
COPY frontend/package.json frontend/package-lock.json* ./frontend/
COPY backend/package.json backend/package-lock.json* ./backend/

RUN cd frontend && npm install && cd ../backend && npm install

COPY frontend ./frontend
COPY backend ./backend

RUN cd backend && npm run build:full

WORKDIR /app/backend

EXPOSE 8000

CMD ["sh", "-c", "npm run start:prod"]
