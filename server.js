/*
  Terminal Chat con WebSockets (Bun + chalk)
  - server.js: servidor central con broadcasting de joins, leaves y mensajes
  - client.js: cliente de terminal con prompt mejorado y colores
*/

// server.js
import { serve } from "bun";
import chalk from "chalk";

const PORT = 3000;
const clients = new Set();

serve({
  port: PORT,

  // Maneja upgrade a WebSocket
  fetch(req, server) {
    if (server.upgrade(req)) return;  // 101 Switching Protocols automático
    return new Response("Upgrade failed", { status: 400 });
  },

  websocket: {
    open(ws) {
      clients.add(ws);
      ws.send(JSON.stringify({ type: "system", text: "Bienvenido al chat. Ingresa tu nombre de usuario:" }));
      console.log(chalk.green("[Servidor]: Nuevo cliente conectado"));
    },

    message(ws, message) {
      let msg;
      try { msg = JSON.parse(message); } catch { return; }

      // Registro de nombre de usuario
      if (msg.type === "username") {
        ws.username = msg.text.trim();
        console.log(chalk.green(`[Servidor]: Usuario "${ws.username}" se ha unido`));
        broadcast({ type: "system", text: `El usuario "${ws.username}" se ha unido al chat.` });
        return;
      }

      // Mensaje de chat
      if (msg.type === "chat" && ws.username) {
        console.log(chalk.blue(`${ws.username}: ${msg.text}`));
        broadcast({ type: "chat", user: ws.username, text: msg.text });
      }
    },

    close(ws) {
      clients.delete(ws);
      if (ws.username) {
        console.log(chalk.red(`[Servidor]: Usuario "${ws.username}" ha salido`));
        broadcast({ type: "system", text: `El usuario "${ws.username}" ha salido del chat.` });
      }
    },

    error(ws, err) {
      console.error(chalk.red(`[Servidor]: Error socket ${ws.username || "?"}:`), err);
    }
  }
});

console.log(chalk.yellow(`🎧 Servidor WebSocket escuchando en ws://localhost:${PORT}`));

// Envía message a todos los clientes conectados
function broadcast(message) {
  const data = JSON.stringify(message);
  for (const client of clients) {
    // readyState 1 indica OPEN
    if (client.readyState === 1) {
      client.send(data);
    }
  }
}
