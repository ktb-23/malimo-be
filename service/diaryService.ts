import { Connection, RowDataPacket } from "mysql2/promise";
import { SaveDiaryType } from "../types/type";
import axios from "axios";
// 일기 서비스
class DiaryService {
  private connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  // 공통 쿼리 실행 함수
  public async executeQuery(query: string, params: any[]): Promise<any> {
    try {
      const [results] = await this.connection.query(query, params);
      return results;
    } catch (error) {
      throw error;
    }
  }

  //   일기 저장 서비스
  public async saveDiary(
    data: SaveDiaryType,
    user_id: number
  ): Promise<{ message: string }> {
    const { date, contents } = data;
    try {
      //이미 날짜 가 있는지 확인
      const findDateQuery =
        "SELECT date_id FROM date_tb WHERE date = ? AND user_id = ?";
      const dateResult = await this.executeQuery(findDateQuery, [
        date,
        user_id,
      ]);

      let date_id: number;
      if (dateResult.length === 0) {
        // 날짜가 없을경우
        const insertDateQuery =
          "INSERT INTO date_tb (date,user_id) VALUES (?,?)";
        const insertDateResult = await this.executeQuery(insertDateQuery, [
          date,
          user_id,
        ]);

        date_id = insertDateResult.insertId;
      } else {
        // 날짜가 있을경우
        date_id = (dateResult[0] as RowDataPacket).date_id;
      }
      //데이터 저장 또는 데이터 업데이트
      const insertDiaryQuery = `
      INSERT INTO diary_tb (user_id, date_id, contents) 
      VALUES (?, ?, ?) 
    `;
      await this.executeQuery(insertDiaryQuery, [user_id, date_id, contents]);
      return { message: "일기가 성공적으로 저장되었습니다." };
    } catch (error) {
      console.error("일기 저장중 오류:", error);
      throw new Error("일기 저장에 실패 했습니다.");
    }
  }
  public async getEmotionAdvise(date: string, user_id: number): Promise<any> {
    try {
      const findDateQuery =
        "SELECT date_id FROM date_tb WHERE date = ? AND user_id = ?";
      const dateResult = await this.executeQuery(findDateQuery, [
        date,
        user_id,
      ]);
      if (dateResult.length === 0) {
        throw new Error("날짜가 없습니다.");
      }
      let date_id: number = (dateResult[0] as RowDataPacket).date_id;
      console.log(date_id);
      const getContentsQuery =
        "SELECT contents FROM diary_tb WHERE date_id = ? AND user_id = ?";

      const contentsResult = await this.executeQuery(getContentsQuery, [
        date_id,
        user_id,
      ]);
      const content: string = (contentsResult[0] as RowDataPacket).contents;
      const flaskApiUrl = "http://3.35.159.74:5001/review";
      const response = await axios.post(
        flaskApiUrl,
        {
          text: content,
          session_id: "default",
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      console.log(response.data);
      return response.data;
    } catch (error) {
      console.error("감정 및 조언 조회 오류:", error);
      throw new Error("감정 및 조언 조회 실패 했습니다.");
    }
  }
}
export default DiaryService;
