import { Request, Response } from "express";
import UserService from "../service/userService";
import connection from "../db";
import { ValidationService } from "../service/validationService";
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
}

export default new UserController();
