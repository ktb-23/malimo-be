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
}

export default UserService;
