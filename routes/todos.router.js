import express from "express";
import Todo from "../schemas/todo.schemas.js";
import Joi from "joi";

const router = express.Router();

// 👉 **할 일 생성 API 유효성 검사 요구사항**

// 1. `value` 데이터는 **필수적으로 존재**해야한다.
// 2. `value` 데이터는 **문자열 타입**이어야한다.
// 3. `value` 데이터는 **최소 1글자 이상**이어야한다.
// 4. `value` 데이터는 **최대 50글자 이하**여야한다.
// 5. 유효성 검사에 실패했을 때, 에러가 발생해야한다.

// 할 일 생성 API의 요청 데이터 검증을 위한 Joi 스키마를 정의합니다.
const createTodoSchema = Joi.object({
  value: Joi.string().min(1).max(50).required(),
});

// <-----할일 등록 api------->
router.post("/todos", async (req, res, next) => {
  // 1. 클라이언트로 부터 받아온 value 데이터를 가져온다
  try {
    const validation = await createTodoSchema.validateAsync(req.body);

    // 클라이언트에게 전달받은 value 데이터를 변수에 저장합니다.
    const { value } = validation;

    // 1-5. 만약, 클라이언트가 value 데이터를 전달하지 않았을때, 클라이언트에 에러메세지를 전달한다
    if (!value) {
      return res
        .status(400)
        .json({ errorMessage: "해야할일(value) 데이터가 존재하지 않습니다." });
    }

    // 2. 해당하는 마지막 order 데이터를 조회한다
    // (Todo는 Todoschema에서 Todo 이름으로 가져온것) // findone은 한개의 데이터 조회
    // sort = 정렬한다 => 어떤컬럼은?  order 라는 이름의 컬럼을 (아무것도 안쓰면 오름차순 / 앞에 -쓰면 내림차순)
    const todoMaxOrder = await Todo.findOne().sort("-order").exec();

    // 3. 만약 존재한다면 현재 햐야할 일을 +1을 하고, order 데이터가 존재하지 않다면, 1로 할당한다
    const order = todoMaxOrder ? todoMaxOrder.order + 1 : 1;

    // 4. 해야할일 등록
    const todo = new Todo({ value, order });
    await todo.save();
    //  5. 해야할일 클라이언트에게 반환
    return res.status(201).json({ todo: todo });
  } catch (error) {
    // Router 다음에 있는 에러 처리 미들웨어를 실행
    next(error);
  }
});

// <-----해야할일 목록 조회 api----->
router.get("/todos", async (req, res, next) => {
  // 1.해야할 일 목록 조회를 진행한다
  const todos = await Todo.find().sort("-order").exec();
  // 2. 해야할일 목록 조회 결과를 클라이언트에 반환
  return res.status(200).json({ todos });
});

//< -----해야할일 순서 변경 api && 완료 / 해제 기능 추가----- >
router.patch("/todos/:todoId", async (req, res) => {
  // 변경할 '해야할 일'의 ID 값을 가져옵니다.
  const { todoId } = req.params;
  // '해야할 일'을 몇번째 순서로 설정할 지 order 값을 가져옵니다.
  const { order, done, value } = req.body;

  // 변경하려는 '해야할 일'을 가져옵니다. 만약, 해당 ID값을 가진 '해야할 일'이 없다면 에러를 발생시킵니다.
  const currentTodo = await Todo.findById(todoId).exec();
  if (!currentTodo) {
    return res
      .status(404)
      .json({ errorMessage: "존재하지 않는 todo 데이터입니다." });
  }

  if (order) {
    // 변경하려는 order 값을 가지고 있는 '해야할 일'을 찾습니다.
    const targetTodo = await Todo.findOne({ order }).exec();
    if (targetTodo) {
      // 만약, 이미 해당 order 값을 가진 '해야할 일'이 있다면, 해당 '해야할 일'의 order 값을 변경하고 저장합니다.
      targetTodo.order = currentTodo.order;
      await targetTodo.save();
    }
    // 변경하려는 '해야할 일'의 order 값을 변경합니니다.
    currentTodo.order = order;
  }

  //  할일 내용 변경 추가
  if (value) {
    currentTodo.value = value;
  }

  if (done !== undefined) {
    currentTodo.doneAt = done ? new Date() : null;
  }

  // 변경된 '해야할 일'을 저장합니다.
  await currentTodo.save();

  return res.status(200).json({});
});

/**------ 할 일 삭제 ------**/
router.delete("/todos/:todoId", async (req, res) => {
  // 삭제할 '해야할 일'의 ID 값을 가져옵니다.
  const { todoId } = req.params;

  // 삭제하려는 '해야할 일'을 가져옵니다. 만약, 해당 ID값을 가진 '해야할 일'이 없다면 에러를 발생시킵니다.
  const todo = await Todo.findById(todoId).exec();
  if (!todo) {
    return res
      .status(404)
      .json({ errorMessage: "존재하지 않는 todo 데이터입니다." });
  }

  // 조회된 '해야할 일'을 삭제합니다.
  await Todo.deleteOne({ _id: todoId }).exec();

  return res.status(200).json({});
});

export default router;
