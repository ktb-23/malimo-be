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
router.get(
  "/:date",
  // verifyTokenMiddleware,
  (req, res) => diaryController.getEmotionAdvise(req, res)
);
export default router;
