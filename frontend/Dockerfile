# ── FUSION NEURAL — Frontend Dockerfile ──────────────────────────────────────
# Multi-stage build: Node.js untuk build, Nginx untuk serve

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files (frontend depends on root node_modules)
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/

# Install dependencies
RUN npm ci

# Copy source code
COPY frontend/ ./frontend/
COPY .env.example ./.env.example

# Build args for environment variables
ARG VITE_API_URL
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_MIDTRANS_SNAP_URL
ARG VITE_MIDTRANS_CLIENT_KEY

# Set env vars for build
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_FIREBASE_API_KEY=${VITE_FIREBASE_API_KEY}
ENV VITE_FIREBASE_AUTH_DOMAIN=${VITE_FIREBASE_AUTH_DOMAIN}
ENV VITE_FIREBASE_PROJECT_ID=${VITE_FIREBASE_PROJECT_ID}
ENV VITE_FIREBASE_STORAGE_BUCKET=${VITE_FIREBASE_STORAGE_BUCKET}
ENV VITE_FIREBASE_MESSAGING_SENDER_ID=${VITE_FIREBASE_MESSAGING_SENDER_ID}
ENV VITE_FIREBASE_APP_ID=${VITE_FIREBASE_APP_ID}
ENV VITE_MIDTRANS_SNAP_URL=${VITE_MIDTRANS_SNAP_URL}
ENV VITE_MIDTRANS_CLIENT_KEY=${VITE_MIDTRANS_CLIENT_KEY}

# Build frontend
RUN cd frontend && npx tsc -b && npx vite build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from builder
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
