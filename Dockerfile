# --- Instalación y Construcción ---
FROM node:22-alpine AS build

# Directorio de trabajo
WORKDIR /app

# Instalar Angular CLI 21.0.0
RUN npm install -g @angular/cli@21.0.0

# Copiar archivos de dependencias e instalar
COPY package*.json ./
RUN npm install

# Copiar el código fuente y construir el proyecto
COPY . .
RUN ng build --configuration production



# --- Servidor de Producción ---
FROM nginx:stable-alpine

# Copiar los archivos generados a Nginx
COPY --from=build /app/dist/Voluntariado4V/browser /usr/share/nginx/html

# Exponer puerto y arrancar
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]