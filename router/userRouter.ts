import { Router } from "express";
import userController from "../controller/userController";
import { verifyTokenMiddleware } from "../authorization/jwt";

const router: Router = Router();

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: 회원가입
 *     description: 유저 생성 회원가입
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Signup'
 *     responses:
 *       201:
 *         description: 회원가입 성공
 *       400:
 *         description: 잘못된 요청
 */
router.post("/register", (req, res) => userController.register(req, res));

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: 로그인
 *     description: 유저 로그인
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Login'
 *     responses:
 *       200:
 *         description: 회원 로그인 성공
 *       401:
 *         description: 인증 권한 없음
 */
router.post("/login", (req, res) => userController.login(req, res));

/**
 * @swagger
 * /api/v1/auth/nickname:
 *   put:
 *     summary: 닉네임 업데이트
 *     description: 유저 닉네임 업데이트
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateNickname'
 *     responses:
 *       200:
 *         description: 닉네임 업데이트 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "닉네임이 성공적으로 변경 되었습니다."
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 권한이 없음
 *       500:
 *         description: 서버 오류
 */
router.put("/nickname", verifyTokenMiddleware, (req, res) =>
  userController.updateNickname(req, res)
);

/**
 * @swagger
 * /api/v1/auth/password:
 *   put:
 *     summary: 비밀번호 업데이트
 *     description: 유저 비밀번호 업데이트
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePassword'
 *     responses:
 *       200:
 *         description: 비밀번호 업데이트 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "비밀번호가 성공적으로 변경 되었습니다."
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 권한이 없음
 *       500:
 *         description: 서버 오류
 */
router.put("/password", verifyTokenMiddleware, (req, res) =>
  userController.updatePassword(req, res)
);
/**
 * @swagger
 * /api/v1/auth:
 *   delete:
 *     summary: 사용자 삭제
 *     description: 유저 데이터 삭제
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 유저 삭제 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "유저가 성공적으로 삭제 되었습니다."
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 권한이 없음
 *       500:
 *         description: 서버 오류
 */
router.delete("/", verifyTokenMiddleware, (req, res) =>
  userController.deleteUser(req, res)
);
/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: 새 토큰 갱신
 *     description: 리프레시 토큰을 통해 새로운 액세스 토큰을 발급
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                  type: integer
 *                  example: 1
 *                  description: 유저 아이디
 *               refreshToken:
 *                 type: string
 *                 description: 리프레시 토큰
 *     responses:
 *       200:
 *         description: 새로운 액세스 토큰 발급 성공
 *       403:
 *         description: 유효하지 않은 리프레시 토큰
 */
router.post("/refresh", userController.refreshToken);
export default router;
