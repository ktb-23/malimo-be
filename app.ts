import express from "express";
const cors = require("cors");
import userRouter from "./router/userRouter";
import diaryRouter from "./router/diaryRouter";
const app = express();
const { swaggerUi, specs } = require("./module/swagger");
app.use(express.json()); // JSON 바디 파서 추가
app.use(cors());
app.set("port", process.env.PORT || 8001);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/api/v1/auth", userRouter);
app.use("/api/v1/diary", diaryRouter);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
app.listen(app.get("port"), () => {
  console.log(app.get("port"), "번에서 대기중");
});
