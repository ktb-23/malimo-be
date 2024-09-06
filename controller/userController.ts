import { Request, Response } from "express";
import UserService from "../service/userService";
import connection from "../db";
import { ValidationService } from "../service/validationService";
import { generateToken, verifyRefreshToken } from "../authorization/jwt";

interface DecodedToken {
  user_id: number;
  iat: number;
  exp: number;
}
interface AuthRequest extends Request {
  user?: DecodedToken;
}
class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService(connection);
  }

  // 회원가입 컨트롤러
  public async register(req: Request, res: Response): Promise<any> {
    const { nickname, email, password } = req.body;
    // 유효성 검사
    const nicknameError = ValidationService.validateNickname(nickname);
    const emailError = ValidationService.validateEmail(email);
    const passwordError = ValidationService.validatePassword(password);

    if (nicknameError || emailError || passwordError) {
      return res.status(400).json({
        error: nicknameError || emailError || passwordError,
      });
    }
    try {
      const result = await this.userService.register(req.body);
      res.status(201).json(result);
    } catch (error: any) {
      console.error(error);
      if (error.message === "모든 필드를 입력해야 합니다.") {
        res.status(400).json({ error: error.message });
      } else if (error.message === "닉네임이 이미 존재합니다.") {
        res.status(409).json({ error: error.message });
      } else {
        res.status(500).json({ error: "회원가입에 실패하였습니다." });
      }
    }
  }

  // 로그인 컨트롤러
  public async login(req: Request, res: Response): Promise<any> {
    const { email, password } = req.body;
    // 유효성 검사
    const emailError = ValidationService.validateEmail(email);
    if (emailError) {
      return res.status(400).json({ error: emailError });
    }
    try {
      const result = await this.userService.login(email, password);
      res.json(result);
    } catch (error: any) {
      console.error(error);
      res.status(401).json({ error: error.message });
    }
  }

  public async updateNickname(req: AuthRequest, res: Response): Promise<void> {
    const { nickname } = req.body;

    if (!req.user) {
      res.status(401).json({ message: "인증 권한 없음" });
      return;
    }

    const userId = req.user.user_id;

    try {
      await this.userService.updateNickname(userId, nickname);
      res.status(200).json({ message: "닉네임이 성공적으로 변경 되었습니다." });
    } catch (error: any) {
      if (error.message.includes("닉네임")) {
        res.status(400).json({ error: error.message });
      } else {
        console.error(error);
        res.status(500).json({ error: "닉네임 업데이트에 실패했습니다." });
      }
    }
  }
  public async updatePassword(req: AuthRequest, res: Response): Promise<any> {
    const { password } = req.body;

    if (!req.user) {
      res.status(401).json({ message: "인증 권한 없음" });
      return;
    }

    try {
      if (password.length < 8) {
        return res
          .status(400)
          .json({ error: "비밀번호는 8자 이상이어야 합니다." });
      }

      // Validate special characters
      const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
      if (!specialCharRegex.test(password)) {
        return res.status(400).json({
          error: "비밀번호는 최소 하나의 특수문자를 포함해야 합니다.",
        });
      }
      const userId = req.user.user_id;
      await this.userService.updatePassword(userId, password);
      res
        .status(200)
        .json({ message: "비밀번호가 성공적으로 변경 되었습니다." });
    } catch (error: any) {
      if (error.message.includes("비밀번호")) {
        res.status(400).json({ error: error.message });
      } else {
        console.error(error);
        res.status(500).json({ error: "비밀번호 업데이트에 실패했습니다." });
      }
    }
  }

  // 사용자 삭제 컨트롤러
  public async deleteUser(req: AuthRequest, res: Response): Promise<any> {
    if (!req.user) {
      res.status(401).json({ message: "인증 권한 없음" });
      return;
    }
    const userId = req.user.user_id;

    try {
      await this.userService.deleteUser(userId);
      res.status(200).json({ message: "사용자가 성공적으로 삭제되었습니다." });
    } catch (error: any) {
      console.error("사용자 삭제 중 오류:", error);
      res.status(500).json({ error: error.message });
    }
  }

  public async refreshToken(req: Request, res: Response): Promise<any> {
    const { refreshToken, user_id } = req.body;
    if (!refreshToken) {
      return res.status(403).json({ message: "리프레쉬 토큰이 없습니다." });
    }
    if (!refreshToken.includes(refreshToken)) {
      return res
        .status(403)
        .json({ message: "유효하지 않은 리프레쉬 토큰 입니다." });
    }
    const decoded = verifyRefreshToken(refreshToken);
    if (decoded) {
      const accesstoken = generateToken({ user_id: user_id });
      return res.json({ accesstoken: accesstoken });
    } else {
      return res.status(403).json("리프레쉬 토큰 검증 실패");
    }
  }
}

export default new UserController();
