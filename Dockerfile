# askTIAN MCP server — streamable-HTTP host (for mcp.asktian.com)
# Build:  docker build -t asktian-mcp .
# Run:    docker run -p 8080:8080 -e ASKTIAN_API_KEY=at_live_... asktian-mcp
# Health: GET /health   ·   MCP endpoint: POST /mcp

# ---- build stage ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- run stage ----
FROM node:20-alpine AS run
WORKDIR /app
ENV NODE_ENV=production
COPY package.json ./
RUN npm install --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist

# HTTP transport on :8080
ENV ASKTIAN_MCP_HTTP=1
ENV PORT=8080
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:8080/health || exit 1

CMD ["node", "dist/server.js"]
