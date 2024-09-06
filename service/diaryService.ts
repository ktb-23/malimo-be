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

      let contents: string = "";
      let diary_id: number | null = null;

      if (contentsResult.length !== 0) {
        contents = (contentsResult[0] as RowDataPacket).contents;
        diary_id = (contentsResult[0] as RowDataPacket).diary_id;
      }
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
  public async getDiaryMonthDate(
    user_id: number,
    month: number,
    year: number
  ): Promise<any> {
    try {
      const getMonthDatesQuery = `
            SELECT d.date
            FROM diary_tb dt
            JOIN date_tb d ON dt.date_id = d.date_id
            WHERE dt.user_id = ?
            AND MONTH(d.date) = ?
            AND YEAR(d.date) = ?
            ORDER BY d.date ASC
        `;

      const monthDatesResult = await this.executeQuery(getMonthDatesQuery, [
        user_id,
        month,
        year,
      ]);

      return monthDatesResult.map((row: RowDataPacket) => row.date) || [];
    } catch (error) {
      console.error("일기 월별 날짜 조회 오류:", error);
      throw new Error("일기 월별 날짜 조회 실패 했습니다.");
    }
  }
  public async getEmotionAdvise(date: string, user_id: number): Promise<any> {
    try {
      // Step 1: Fetch diary contents
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
      const date_id: number = (contentsResult[0] as RowDataPacket).date_id;

      // Step 2: Check if assistant_id and thread_id exist
      const checkAssistantQuery =
        "SELECT assistant_id, thread_id FROM user_tb WHERE user_id = ?";
      const assistantResult = await this.executeQuery(checkAssistantQuery, [
        user_id,
      ]);
      const user = assistantResult[0] as RowDataPacket;

      let assistant_id = user.assistant_id;
      let thread_id = user.thread_id;

      if (!assistant_id || !thread_id) {
        // Request a new assistant_id and thread_id from Flask API
        const flaskApiUrl = "http://3.35.159.74:5001/get_or_create_assistant";
        const response = await axios.post(
          flaskApiUrl,
          { user_id },
          { headers: { "Content-Type": "application/json" } }
        );

        assistant_id = response.data.assistant_id;
        thread_id = response.data.thread_id;

        // Update user_tb with new assistant_id and thread_id
        const updateAssistantIdQuery = `
                UPDATE user_tb
                SET assistant_id = ?, thread_id = ?
                WHERE user_id = ?
            `;
        await this.executeQuery(updateAssistantIdQuery, [
          assistant_id,
          thread_id,
          user_id,
        ]);
      }

      // Step 3: Analyze the contents
      const analyzeApiUrl = "http://3.35.159.74:5001/analyze";
      const analyzeRequestBody = { assistant_id, thread_id, message: contents };
      const analyzeResponse = await axios.post(
        analyzeApiUrl,
        analyzeRequestBody,
        { headers: { "Content-Type": "application/json" } }
      );

      const { emotion_analysis, total_score, summary, advice } =
        analyzeResponse.data;

      // Step 4: Update diary_tb and emotion_stat_tb
      const updateDiaryQuery = `
            UPDATE diary_tb
            SET emotion_analysis = ?, summary = ?, advice = ?
            WHERE user_id = ? AND date_id = ?
        `;
      await this.executeQuery(updateDiaryQuery, [
        emotion_analysis,
        summary,
        advice,
        user_id,
        date_id,
      ]);

      const updateEmotionStatQuery = `
            INSERT INTO emotion_stat_tb (user_id, date_id, total_score)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE total_score = VALUES(total_score);
        `;
      await this.executeQuery(updateEmotionStatQuery, [
        user_id,
        date_id,
        total_score,
      ]);

      // Step 5: Fetch the data to return to client
      const getDiaryAndScoreDataQuery = `
            SELECT dt.emotion_analysis, dt.summary, dt.advice, es.total_score
            FROM diary_tb dt
            JOIN emotion_stat_tb es ON dt.date_id = es.date_id
            WHERE dt.user_id = ? AND dt.date_id = ?
        `;
      const diaryAndScoreDataResult = await this.executeQuery(
        getDiaryAndScoreDataQuery,
        [user_id, date_id]
      );

      return {
        emotion_analysis: (diaryAndScoreDataResult[0] as RowDataPacket)
          .emotion_analysis,
        summary: (diaryAndScoreDataResult[0] as RowDataPacket).summary,
        advice: (diaryAndScoreDataResult[0] as RowDataPacket).advice,
        total_score: (diaryAndScoreDataResult[0] as RowDataPacket).total_score,
      };
    } catch (error) {
      console.error("감정 및 조언 조회 오류:", error);
      throw new Error("감정 및 조언 조회 실패 했습니다.");
    }
  }
}
export default DiaryService;
