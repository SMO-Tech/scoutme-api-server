import express from "express";
import dotenv from "dotenv";
import userRouter from "./routes/user";
import matchRouter from "./routes/match";
import clubRouter from "./routes/club_routes";
import cors from "cors";
import swagger from './swagger'
dotenv.config();
const app = express();
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
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

//swagger route 
app.use("/api-docs", swagger.swaggerUi.serve, swagger.swaggerUi.setup(swagger.specs))

const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`Server running on port, http://localhost:${PORT}`)
);
