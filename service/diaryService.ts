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

      // 일기 테이블에 user_id와 date_id로 기존 데이터가 있는지 확인
      const findDiaryQuery =
        "SELECT diary_id FROM diary_tb WHERE date_id = ? AND user_id = ?";
      const diaryResult = await this.executeQuery(findDiaryQuery, [
        date_id,
        user_id,
      ]);

      if (diaryResult.length > 0) {
        // 이미 존재할 경우
        return { message: "해당 날짜에 이미 일기가 있습니다." };
      } else {
        // 존재하지 않을 경우, 새로 삽입
        const insertDiaryQuery = `
        INSERT INTO diary_tb (user_id, date_id, contents) 
        VALUES (?, ?, ?)
      `;
        await this.executeQuery(insertDiaryQuery, [user_id, date_id, contents]);
        return { message: "일기가 성공적으로 저장되었습니다." };
      }
    } catch (error) {
      console.error("일기 저장 중 오류:", error);
      throw new Error("일기 저장에 실패했습니다.");
    }
  }

  public async getDiary(date: string, user_id: number): Promise<any> {
    try {
      const getContentsQuery = `
      SELECT  dt.contents, dt.diary_id
      FROM diary_tb dt
      JOIN date_tb d ON dt.date_id = d.date_id
      WHERE d.date = ? AND d.user_id = ?
    `;
      const contentsResult = await this.executeQuery(getContentsQuery, [
        date,
        user_id,
      ]);

      if (contentsResult.length === 0) {
        throw new Error("날짜 또는 일기가 없습니다.");
      }

      const contents: string = (contentsResult[0] as RowDataPacket).contents;
      const diary_id: number = (contentsResult[0] as RowDataPacket).diary_id;
      return { diary_id, contents };
    } catch (error: any) {
      console.error("일기 조회 오류:", error);
      throw new Error("일기 조회 실패 했습니다.");
    }
  }

  public async updateDiary(
    diary_id: string,
    user_id: number,
    contents: any
  ): Promise<any> {
    try {
      const updateContentsQuery = ` UPDATE diary_tb 
        SET contents = ? 
        WHERE diary_id = ? AND user_id = ?`;
      await this.executeQuery(updateContentsQuery, [
        contents,
        diary_id,
        user_id,
      ]);
      return { message: "일기가 성공적으로 업데이트되었습니다." };
    } catch (error) {
      console.error("일기 업데이트 중 오류:", error);
      throw new Error("일기 업데이트에 실패 했습니다.");
    }
  }

  public async deleteDiary(diary_id: string, user_id: number): Promise<any> {
    try {
      const deleteContentQuery = `
      DELETE FROM diary_tb WHERE diary_id = ? AND user_id = ?;
      `;

      await this.executeQuery(deleteContentQuery, [diary_id, user_id]);
      return { message: "일기가 성공적으로 삭제 되었습니다." };
    } catch (error) {
      console.error("일기 삭제 중 오류:", error);
      throw new Error("일기 삭제에 실패 했습니다.");
    }
  }

  public async getEmotionAdvise(date: string, user_id: number): Promise<any> {
    try {
      const getContentsQuery = `
        SELECT dt.date_id, dt.contents
        FROM diary_tb dt
        JOIN date_tb d ON dt.date_id = d.date_id
        WHERE d.date = ? AND d.user_id = ?
      `;

      const contentsResult = await this.executeQuery(getContentsQuery, [
        date,
        user_id,
      ]);

      if (contentsResult.length === 0) {
        throw new Error("날짜 또는 일기가 없습니다.");
      }

      const contents: string = (contentsResult[0] as RowDataPacket).contents;

      const flaskApiUrl = "http://3.35.159.74:5001/review";
      const response = await axios.post(
        flaskApiUrl,
        {
          text: contents,
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
