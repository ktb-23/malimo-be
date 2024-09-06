import { Connection, RowDataPacket } from "mysql2/promise";
import { SaveDiaryType } from "../types/type";
import axios from "axios";
// Define the shape of the analysis results
interface AnalysisResults {
  emotion_analysis: string | null;
  summary: string | null;
  advice: string | null;
  total_score: number | null;
}
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

  private async fetchDiaryContents(
    date: string,
    user_id: number
  ): Promise<any | null> {
    const getContentsQuery = `
      SELECT dt.date_id, dt.contents, dt.summary, dt.emotion_analysis, dt.advice
      FROM diary_tb dt
      JOIN date_tb d ON dt.date_id = d.date_id
      WHERE d.date = ? AND d.user_id = ?
    `;
    const contentsResult = await this.executeQuery(getContentsQuery, [
      date,
      user_id,
    ]);

    if (contentsResult.length === 0) {
      return null;
    }

    const result = contentsResult[0] as RowDataPacket;
    return {
      contents: result.contents,
      date_id: result.date_id,
      summary: result.summary || null,
      emotion_analysis: result.emotion_analysis || null,
      advice: result.advice || null,
    };
  }

  private async checkOrCreateAssistant(
    user_id: number
  ): Promise<{ assistant_id: string; thread_id: string }> {
    const checkAssistantQuery =
      "SELECT assistant_id, thread_id FROM user_tb WHERE user_id = ?";
    const assistantResult = await this.executeQuery(checkAssistantQuery, [
      user_id,
    ]);
    const user = assistantResult[0] as RowDataPacket;

    let { assistant_id, thread_id } = user;

    if (!assistant_id || !thread_id) {
      const flaskApiUrl = "http://3.35.159.74:5001/get_or_create_assistant";
      const response = await axios.post(
        flaskApiUrl,
        { user_id },
        { headers: { "Content-Type": "application/json" } }
      );
      assistant_id = response.data.assistant_id;
      thread_id = response.data.thread_id;

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

    return { assistant_id, thread_id };
  }

  private async analyzeContents(
    assistant_id: string,
    thread_id: string,
    contents: string
  ): Promise<any> {
    const analyzeApiUrl = "http://3.35.159.74:5001/analyze";
    const analyzeRequestBody = { assistant_id, thread_id, message: contents };
    const analyzeResponse = await axios.post(
      analyzeApiUrl,
      analyzeRequestBody,
      { headers: { "Content-Type": "application/json" } }
    );

    return analyzeResponse.data;
  }

  private async updateDiaryAdvice(
    user_id: number,
    date_id: number,
    emotion_analysis: string,
    summary: string,
    advice: string
  ): Promise<void> {
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
  }

  private async updateEmotionStats(
    user_id: number,
    date_id: number,
    total_score: number
  ): Promise<void> {
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
  }

  private async fetchWeekScores(
    user_id: number,
    startDate: string,
    endDate: string
  ): Promise<number[]> {
    const getWeekEmotionScoresQuery = `
    SELECT d.date, es.total_score
    FROM emotion_stat_tb es
    JOIN date_tb d ON es.date_id = d.date_id
    WHERE es.user_id = ? AND d.date BETWEEN ? AND ?
  `;
    const weekEmotionScoresResult = await this.executeQuery(
      getWeekEmotionScoresQuery,
      [user_id, startDate, endDate]
    );

    const totalScoresByWeekday = Array(7).fill(null);
    weekEmotionScoresResult.forEach((row: any) => {
      const day = new Date(row.date).getDay();
      totalScoresByWeekday[day] = row.total_score;
    });

    return totalScoresByWeekday;
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = ("0" + (date.getMonth() + 1)).slice(-2);
    const day = ("0" + date.getDate()).slice(-2);
    return `${year}.${month}.${day}`;
  }

  public async getEmotionAdvise(date: string, user_id: number): Promise<any> {
    try {
      // Fetch the current day's diary contents
      const currentDiaryData = await this.fetchDiaryContents(date, user_id);
      if (!currentDiaryData || !currentDiaryData.contents) {
        throw new Error("날짜 또는 일기가 없습니다.");
      }

      // Check or create assistant and thread IDs
      const { assistant_id, thread_id } = await this.checkOrCreateAssistant(
        user_id
      );

      // Fetch the previous day's diary entry
      const previousDay = new Date(date);
      previousDay.setDate(previousDay.getDate() - 1);
      const formattedPreviousDay = this.formatDate(previousDay);
      const prevDiaryData = await this.fetchDiaryContents(
        formattedPreviousDay,
        user_id
      );

      let previousSummary: string | null = null;
      let previousEmotionAnalysis: string | null = null;

      if (prevDiaryData && prevDiaryData.contents) {
        previousSummary = prevDiaryData.summary;
        previousEmotionAnalysis = prevDiaryData.emotion_analysis;

        if (
          !prevDiaryData.emotion_analysis ||
          !prevDiaryData.summary ||
          !prevDiaryData.advice
        ) {
          const prevAnalysisResults = await this.analyzeContents(
            assistant_id,
            thread_id,
            prevDiaryData.contents
          );

          await this.updateDiaryAdvice(
            user_id,
            prevDiaryData.date_id,
            prevAnalysisResults.emotion_analysis,
            prevAnalysisResults.summary,
            prevAnalysisResults.advice
          );
          await this.updateEmotionStats(
            user_id,
            prevDiaryData.date_id,
            prevAnalysisResults.total_score
          );

          previousSummary = prevAnalysisResults.summary;
          previousEmotionAnalysis = prevAnalysisResults.emotion_analysis;
        }
      }

      // Check if the current day's contents need to be analyzed
      let currentAnalysisResults: AnalysisResults = {
        emotion_analysis: currentDiaryData.emotion_analysis,
        summary: currentDiaryData.summary,
        advice: currentDiaryData.advice,
        total_score: null,
      };

      if (
        !currentDiaryData.emotion_analysis ||
        !currentDiaryData.summary ||
        !currentDiaryData.advice
      ) {
        currentAnalysisResults = await this.analyzeContents(
          assistant_id,
          thread_id,
          currentDiaryData.contents
        );

        await this.updateDiaryAdvice(
          user_id,
          currentDiaryData.date_id,
          currentAnalysisResults.emotion_analysis || "", // Handle potential null
          currentAnalysisResults.summary || "", // Handle potential null
          currentAnalysisResults.advice || "" // Handle potential null
        );
        await this.updateEmotionStats(
          user_id,
          currentDiaryData.date_id,
          currentAnalysisResults.total_score || 0 // Handle potential null
        );
      }

      // Calculate the start and end dates of the current week
      const endDate = new Date(date);
      const startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - endDate.getDay());
      endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

      const formattedStartDate = this.formatDate(startDate);
      const formattedEndDate = this.formatDate(endDate);

      // Fetch the total scores for the entire week
      const totalScoresByWeekday = await this.fetchWeekScores(
        user_id,
        formattedStartDate,
        formattedEndDate
      );

      // Return the results
      return {
        emotion_analysis: previousEmotionAnalysis || null,
        summary: previousSummary || null,
        advice: currentAnalysisResults.advice || null,
        total_scores:
          totalScoresByWeekday.length > 0
            ? totalScoresByWeekday
            : Array(7).fill(null),
      };
    } catch (error) {
      console.error("Error retrieving emotion and advice:", error);
      return {
        emotion_analysis: null,
        summary: null,
        advice: null,
        total_scores: null,
      };
    }
  }
}
export default DiaryService;
