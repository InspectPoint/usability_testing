# Tiny zero-dependency Node app. No npm install needed.
FROM node:22-slim
WORKDIR /app
COPY server.js dashboard.html ./
ENV PORT=8080
ENV DATA_FILE=/data/results.jsonl
EXPOSE 8080
CMD ["node", "server.js"]
