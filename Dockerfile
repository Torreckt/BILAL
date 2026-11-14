# Production image: builds the site, then runs it together with the database scripts (migrate, seed, admin:create).
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production PORT=3000 UPLOAD_DIR=/data/uploads
COPY --from=build /app ./
RUN mkdir -p /data/uploads && chown -R node:node /data /app/.next
USER node
EXPOSE 3000
# Apply pending migrations, then start the server.
CMD ["sh", "-c", "npm run db:migrate && npm run start"]
