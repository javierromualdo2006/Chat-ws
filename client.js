
// client.js
import WebSocket from "ws";
import chalk from "chalk";
import readline from "node:readline";

const SERVER_URL = "ws://localhost:3000";
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.setPrompt("> ");

const ws = new WebSocket(SERVER_URL);
let ready = false;

ws.on("open", () => {
  console.log(chalk.gray("[Sistema]: Conexión establecida. Esperando saludo del servidor..."));
  rl.prompt();
});

rl.on("line", (line) => {
  if (!ready) {
    // Ignora líneas antes de solicitar username
    return;
  }
  const text = line.trim();
  if (text.toLowerCase() === "/salir") {
    ws.close();
  } else if (text) {
    ws.send(JSON.stringify({ type: "chat", text }));
  }
  rl.prompt();
});

ws.on("message", (data) => {
  let msg;
  try { msg = JSON.parse(data.toString()); } catch { return; }

  if (msg.type === "system") {
    console.log(chalk.gray(`\n[Servidor]: ${msg.text}`));
    if (msg.text.includes("Ingresa tu nombre de usuario")) {
      rl.question("Nombre de usuario: ", (name) => {
        ws.send(JSON.stringify({ type: "username", text: name }));
        console.log(chalk.green(`Conectado al chat como "${name}".`));
        ready = true;
        rl.prompt();
      });
    } else {
      rl.prompt();
    }

  } else if (msg.type === "chat") {
    console.log(chalk.cyan(`\n${msg.user}: ${msg.text}`));
    rl.prompt();
  }
});

ws.on("close", () => {
  console.log(chalk.red("\nDesconectado del servidor."));
  process.exit(0);
});

ws.on("error", (err) => console.error(chalk.red("Error de conexión:"), err));
