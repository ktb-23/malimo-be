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
      // Step 1: Get the contents from the diary
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

      // Step 2: Check if assistant_id exists
      const checkAssistantQuery =
        "SELECT assistant_id FROM user_tb WHERE user_id = ?";
      const assistantResult = await this.executeQuery(checkAssistantQuery, [
        user_id,
      ]);
      const user = assistantResult[0] as RowDataPacket;

      if (user.assistant_id) {
        // Step 3: Fetch data from diary_tb and emotion_stat_tb
        const getDiaryDataQuery = `
          SELECT emotion_analysis, summary, advice
          FROM diary_tb
          WHERE user_id = ? AND date_id = ?
        `;
        const diaryDataResult = await this.executeQuery(getDiaryDataQuery, [
          user_id,
          date_id,
        ]);

        const getEmotionStatDataQuery = `
          SELECT total_score
          FROM emotion_stat_tb
          WHERE user_id = ? AND date_id = ?
        `;
        const emotionStatDataResult = await this.executeQuery(
          getEmotionStatDataQuery,
          [user_id, date_id]
        );

        if (
          diaryDataResult.length === 0 ||
          emotionStatDataResult.length === 0
        ) {
          throw new Error("감정 분석 결과가 없습니다.");
        }

        return {
          emotion_analysis: (diaryDataResult[0] as RowDataPacket)
            .emotion_analysis,
          summary: (diaryDataResult[0] as RowDataPacket).summary,
          advice: (diaryDataResult[0] as RowDataPacket).advice,
          total_score: (emotionStatDataResult[0] as RowDataPacket).total_score,
        };
      } else {
        // Step 4: Request a new assistant_id and analyze
        const flaskApiUrl = "http://3.35.159.74:5001/get_or_create_assistant";
        const requestBody = { user_id };
        const response = await axios.post(flaskApiUrl, requestBody, {
          headers: { "Content-Type": "application/json" },
        });

        const newAssistantId = response.data.assistant_id;

        // Update user_tb with new assistant_id
        const updateAssistantIdQuery = `
          UPDATE user_tb
          SET assistant_id = ?
          WHERE user_id = ?
        `;
        await this.executeQuery(updateAssistantIdQuery, [
          newAssistantId,
          user_id,
        ]);

        // Request analyze with new assistant_id
        const analyzeApiUrl = "http://3.35.159.74:5001/analyze";
        const analyzeRequestBody = {
          user_id,
          message: contents,
          assistant_id: newAssistantId,
        };
        const analyzeResponse = await axios.post(
          analyzeApiUrl,
          analyzeRequestBody,
          {
            headers: { "Content-Type": "application/json" },
          }
        );

        const { emotion_analysis, total_score, summary, advice } =
          analyzeResponse.data;

        // Update diary_tb and emotion_stat_tb with new data
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
  UPDATE emotion_stat_tb
  SET total_score = ?
  WHERE user_id = ? AND date_id = ?
`;
        await this.executeQuery(updateEmotionStatQuery, [
          total_score,
          user_id,
          date_id,
        ]);

        return {
          emotion_analysis,
          summary,
          advice,
          total_score,
        };
      }
    } catch (error) {
      console.error("감정 및 조언 조회 오류:", error);
      throw new Error("감정 및 조언 조회 실패 했습니다.");
    }
  }
}
export default DiaryService;
