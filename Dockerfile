FROM node:20-alpine

WORKDIR /app

# Build frontend
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install

COPY frontend/ ./frontend/
RUN cd frontend && npm run build

# Install backend
COPY backend/package*.json ./backend/
RUN cd backend && npm install

COPY backend/ ./backend/

# Copy built frontend into backend serving path
RUN cp -r frontend/dist backend/dist

EXPOSE 3000
ENV PORT=3000

CMD ["node", "backend/server.js"]
