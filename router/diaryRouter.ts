import { Router } from "express";
import diaryController from "../controller/diaryController";
import { verifyTokenMiddleware } from "../authorization/jwt";

const router: Router = Router();

/**
 * @swagger
 * /api/v1/diary:
 *   post:
 *     summary: 일기 작성
 *     description: 유저 일기 작성
 *     tags:
 *       - Diary
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SaveDiary'
 *     responses:
 *       200:
 *         description: 일기 작성 성공
 *       403:
 *         description: 토큰이 없음
 *       404:
 *         description: 유저가 없음
 *       401:
 *         description: 인증 권한이 없음
 */
router.post("/", verifyTokenMiddleware, (req, res) =>
  diaryController.saveDiary(req, res)
);

/**
 * @swagger
 * /api/v1/diary/{date}:
 *   get:
 *     summary: 일기 조회
 *     description: 유저 일기 상세 조회
 *     tags:
 *       - Diary
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           example: 2024.09.06
 *         description: 2024.09.05
 *     responses:
 *       200:
 *         description: 감정 일기 및 오늘의 조언 조회
 *         content:
 *           application/json:
 *             schema:
 *              $ref: '#/components/schemas/SaveDiary'
 *       403:
 *         description: 토큰이 없음
 *       404:
 *         description: 유저가 없음
 *       401:
 *         description: 인증 권한이 없음
 */
router.get("/:date", verifyTokenMiddleware, (req, res) =>
  diaryController.getDiary(req, res)
);

/**
 * @swagger
 * /api/v1/diary/{diary_id}:
 *   put:
 *     summary: 일기 업데이트
 *     description: 유저 일기 업데이트
 *     tags:
 *       - Diary
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: diary_id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *         description: 다이어리 아이디
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateDiary'
 *     responses:
 *       200:
 *         description: 일기 업데이트 성공
 *       403:
 *         description: 토큰이 없음
 *       404:
 *         description: 유저가 없음
 *       401:
 *         description: 인증 권한이 없음
 */
router.put("/:diary_id", verifyTokenMiddleware, (req, res) =>
  diaryController.updateDiary(req, res)
);

/**
 * @swagger
 * /api/v1/diary/{diary_id}:
 *   delete:
 *     summary: 일기 삭제
 *     description: 유저 일기 삭제
 *     tags:
 *       - Diary
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: diary_id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *         description: 다이어리 아이디
 *     responses:
 *       200:
 *         description: 일기 삭제 성공
 *       403:
 *         description: 토큰이 없음
 *       404:
 *         description: 유저가 없음
 *       401:
 *         description: 인증 권한이 없음
 */

router.delete("/:diary_id", verifyTokenMiddleware, (req, res) =>
  diaryController.deleteDiary(req, res)
);

/**
 * @swagger
 * /api/v1/diary/advise/{date}:
 *   get:
 *     summary: 감정 일기 및 오늘의 조언 조회
 *     description: 유저 감정 일기 및 오늘의 조언 조회
 *     tags:
 *       - Diary
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           example: 2024.09.06
 *         description: 2024.09.05
 *     responses:
 *       200:
 *         description: 감정 일기 및 오늘의 조언 조회
 *         content:
 *           application/json:
 *             schema:
 *              $ref: '#/components/schemas/SaveDiary'
 *       403:
 *         description: 토큰이 없음
 *       404:
 *         description: 유저가 없음
 *       401:
 *         description: 인증 권한이 없음
 */
router.get("/advise/:date", verifyTokenMiddleware, (req, res) =>
  diaryController.getEmotionAdvise(req, res)
);

/**
 * @swagger
 * /api/v1/diary/monthly/{year}/{month}:
 *   get:
 *     summary: 월 일기 날짜 조회
 *     description: 유저 월 일기 날짜 조회
 *     tags:
 *       - Diary
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *           example: 2024
 *       - in: path
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *           example: 9
 *     responses:
 *       200:
 *         description: 월 일기 조회
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 dates:
 *                   type: array
 *                   items:
 *                     type: string
 *                     format: date
 *       403:
 *         description: 토큰이 없음
 *       404:
 *         description: 유저가 없음
 *       401:
 *         description: 인증 권한이 없음
 */

router.get("/monthly/:year/:month", verifyTokenMiddleware, (req, res) =>
  diaryController.getDiaryMonthDate(req, res)
);
export default router;
