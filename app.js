import express from "express";
import connect from "./schemas/index.js";
import todosRouter from "./routes/todos.router.js";
import errorHandlerMiddleware from "./middlewares/error-handler.middleware.js";

const app = express();
const PORT = 3000;

connect();

// Express에서 req.body에 접근하여 body 데이터를 사용할 수 있도록 설정합니다.
app.use(express.json()); //미들웨어 1
app.use(express.urlencoded({ extended: true })); // 미들웨어 2
app.use(express.static("./assets")); // 미들웨어 3

app.use((req, res, next) => {
  //미들웨어 4
  console.log("Request URL:", req.originalUrl, " - ", new Date());
  next();
});

const router = express.Router();

router.get("/", (req, res) => {
  return res.json({ message: "Hi!" });
});

//app.use 는 미들웨어를 사용하게 해주는 코드
//인자로 들어간 /api 에 의해서 http://127.0.0.1:8080/api 경로로 접근하는 경우에만 json 미들웨어를 거친 뒤, router로 연결함
app.use("/api", [router, todosRouter]); // 미들웨어 5

// 에러 처리 미들웨어를 등록
app.use(errorHandlerMiddleware);

app.listen(PORT, () => {
  console.log(PORT, "포트로 서버가 열렸어요!");
});
