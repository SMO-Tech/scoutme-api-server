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
      process.env.FRONTEND_URL,
      "https://scoutme.cloud",
      "http://localhost:3000",
    ].filter((origin): origin is string => Boolean(origin)), // Remove any undefined/null values
    credentials: true,
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", (req, res) => {
  res.json("Hello World");
});

app.use("/user", userRouter);
app.use("/match", matchRouter);
app.use("/club", clubRouter);
app.use("/player", playerRouter);
app.use("/internal", internalRouter);

//swagger route 
app.use("/swagger", swagger.swaggerUi.serve, swagger.swaggerUi.setup(swagger.specs))

const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`Server running on port, http://localhost:${PORT}`)
);
