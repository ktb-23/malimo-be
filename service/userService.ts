import { Connection, RowDataPacket } from "mysql2/promise";
import bcrypt from "bcryptjs";
import { generateToken, generateRefreshToken } from "../authorization/jwt";
import { LoginResponseType, UserType } from "../types/type";

// 회원 서비스
class UserService {
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

  //  닉네임 중복확인
  public async checkDuplicateNickname(nickname: string): Promise<void> {
    const query = "SELECT * FROM user_tb WHERE nickname = ?";
    const result = await this.executeQuery(query, [nickname]);

    if (result.length > 0) {
      throw new Error("닉네임이 이미 존재합니다.");
    }
  }

  // 회원가입 서비스
  public async register(
    data: UserType
  ): Promise<{ message: string; id: number }> {
    if (!data.nickname || !data.email || !data.password) {
      throw new Error("모든 필드를 입력해야 합니다.");
    }

    // 닉네임 중복 확인
    await this.checkDuplicateNickname(data.nickname);
    // 해시된 비밀번호
    const hashedPassword = await bcrypt.hash(data.password, 8);

    const query =
      "INSERT INTO user_tb (nickname, email, password) VALUES (?, ?, ?)";
    const result = await this.executeQuery(query, [
      data.nickname,
      data.email,
      hashedPassword,
    ]);

    return { message: "회원가입 성공했습니다", id: result.insertId };
  }

  // 로그인 서비스
  public async login(
    email: string,
    password: string
  ): Promise<LoginResponseType> {
    const query = "SELECT * FROM user_tb WHERE email = ?";
    const result = await this.executeQuery(query, [email]);

    if (result.length === 0) {
      throw new Error("존재하지 않는 회원");
    }

    const user = result[0] as RowDataPacket;

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new Error("비밀번호가 틀림");
    }

    const accessToken = generateToken({ user_id: user.user_id });
    const refreshToken = generateRefreshToken({ user_id: user.user_id });

    return {
      user_id: user.user_id,
      nickname: user.nickname,
      accessToken,
      refreshToken,
    };
  }
  public async updateNickname(
    user_id: number,
    nickname: string
  ): Promise<void> {
    // 닉네임 길이 확인
    if (nickname.length < 2 || nickname.length > 20) {
      throw new Error("닉네임은 2자 이상 20자 이하여야 합니다.");
    }

    // 닉네임 중복 확인
    await this.checkDuplicateNickname(nickname);

    try {
      const updateNicknameQuery = `
        UPDATE user_tb
        SET nickname = ?
        WHERE user_id = ?
      `;
      await this.executeQuery(updateNicknameQuery, [nickname, user_id]);
    } catch (error) {
      console.error("닉네임 업데이트 중 오류:", error);
      throw new Error("닉네임 업데이트에 실패 했습니다.");
    }
  }
  public async updatePassword(user_id: number, password: string): Promise<any> {
    try {
      const hashedPassword = await bcrypt.hash(password, 8);
      const updatePasswordQuery = `
        UPDATE user_tb
        SET password = ?
        WHERE user_id = ?
      `;
      await this.executeQuery(updatePasswordQuery, [hashedPassword, user_id]);
    } catch (error) {
      console.error("비밀번호 업데이트 중 오류:", error);
      throw new Error("비밀번호 업데이트에 실패 했습니다.");
    }
  }

  public async deleteUser(user_id: number): Promise<{ message: string }> {
    try {
      // Delete from diary_tb
      const deleteDiaryQuery = "DELETE FROM diary_tb WHERE user_id = ?";
      await this.executeQuery(deleteDiaryQuery, [user_id]);
      // Delete from emotion_stat_tb
      const deleteEmotionStatQuery =
        "DELETE FROM emotion_stat_tb WHERE user_id = ?";
      await this.executeQuery(deleteEmotionStatQuery, [user_id]);

      // Delete from date_tb
      const deleteDateQuery = "DELETE FROM date_tb WHERE user_id = ?";
      await this.executeQuery(deleteDateQuery, [user_id]);

      // Finally, delete the user from user_tb
      const deleteUserQuery = "DELETE FROM user_tb WHERE user_id = ?";
      await this.executeQuery(deleteUserQuery, [user_id]);

      return { message: "사용자가 성공적으로 삭제되었습니다." };
    } catch (error) {
      console.error("사용자 삭제 중 오류:", error);
      throw new Error("사용자 삭제에 실패했습니다.");
    }
  }
}

export default UserService;
