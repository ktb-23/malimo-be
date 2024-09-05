import { Request, Response } from "express";
import connection from "../db";
import DiaryService from "../service/diaryService";
interface DecodedToken {
  user_id: number;
  iat: number;
  exp: number;
}
interface AuthRequest extends Request {
  user?: DecodedToken;
}
class diaryController {
  private diaryService: DiaryService;

  constructor() {
    this.diaryService = new DiaryService(connection);
  }

  // 일기 저장 컨트롤러
  public async saveDiary(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = req.body;
      if (!req.user) {
        res.status(401).json({ message: "인증 권한 없음" });
        return;
      }
      const userId = req.user.user_id;
      const result = await this.diaryService.saveDiary(data, userId);
      res.status(200).json({ message: result });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  public async getEmotionAdvise(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    const { date } = req.params;
    // if (!req.user) {
    //   res.status(401).json({ message: "인증 권한 없음" });
    //   return;
    // }
    // const userId = req.user.user_id;
    const userId = 1;
    try {
      const result = await this.diaryService.getEmotionAdvise(date, userId);
      res.status(200).json(result);
      //   res.status(200).json({ result: "123" });
    } catch (error) {
      console.error("감정 및 조언 조회 중 에러:", error);
      res.status(500).json({ error: "감정 및 조언 조회 중 에러" });
    }
  }
}
export default new diaryController();
