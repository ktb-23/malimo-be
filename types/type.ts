export interface UserType {
  nickname: string;
  password: string;
  email: string;
}

export interface LoginResponseType {
  user_id: string;
  nickname: string;
  accessToken: string;
  refreshToken: string;
}
export interface SaveDiaryType {
  user_id: number;
  date_id: number;
  date: string;
  contents: string;
}
