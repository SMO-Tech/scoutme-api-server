import express from "express";
import dotenv from "dotenv";
import userRouter from "./routes/user";
import matchRouter from "./routes/match";
import clubRouter from "./routes/club_routes";
import playerRouter from "./routes/player_routes";
import internalRouter from "./routes/internal"

import cors from "cors"
import swagger from './swagger'
dotenv.config();
const app = express();
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL!,
      "http://localhost:3000",
    ],
    credentials: true,
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", (req, res) => {
  res.json("Hello World");
});

// Test route - placed early to avoid conflicts
app.get('/test', (req, res) => {
  res.json({ 
    message: "Test route working",
    headers: req.headers,
    timestamp: new Date().toISOString()
  });
});

app.use("/user", userRouter);
app.use("/match", matchRouter);
app.use("/club", clubRouter);
app.use("/player", playerRouter);
app.use("/internal", internalRouter);

//swagger route 
app.use("/swagger", swagger.swaggerUi.serve, swagger.swaggerUi.setup(swagger.specs))

// 404 handler - must be last
app.use((req, res) => {
  res.status(404).json({ 
    error: "Route not found", 
    path: req.path,
    method: req.method 
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`Server running on port, http://localhost:${PORT}`)
);
