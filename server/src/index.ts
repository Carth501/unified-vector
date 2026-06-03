import express, { type Request, type Response } from "express";

const app = express();
const port = Number(process.env.PORT ?? 3001);

let globalScore = 0;
const clients = new Set<Response>();

const sendScore = (response: Response) => {
  response.write(
    `event: score\ndata: ${JSON.stringify({ score: globalScore })}\n\n`,
  );
};

const broadcastScore = () => {
  for (const client of clients) {
    sendScore(client);
  }
};

app.get("/api/score", (_request: Request, response: Response) => {
  response.json({ score: globalScore });
});

app.post("/api/score/increment", (_request: Request, response: Response) => {
  globalScore += 1;
  broadcastScore();
  response.json({ score: globalScore });
});

app.get("/api/score/stream", (request: Request, response: Response) => {
  response.setHeader("Content-Type", "text/event-stream");
  response.setHeader("Cache-Control", "no-cache, no-transform");
  response.setHeader("Connection", "keep-alive");
  response.setHeader("X-Accel-Buffering", "no");
  response.flushHeaders();

  clients.add(response);
  sendScore(response);

  request.on("close", () => {
    clients.delete(response);
    response.end();
  });
});

const scoreTicker = setInterval(() => {
  broadcastScore();
}, 1000);

scoreTicker.unref();

app.listen(port, () => {
  console.log(`Score server listening on http://localhost:${port}`);
});
