export class ValidationService {
  // 닉네임 유효성 검사
  public static validateNickname(nickname: string): string | null {
    if (!nickname) {
      return "닉네임을 입력해주세요.";
    }
    if (nickname.length < 2 || nickname.length > 20) {
      return "닉네임은 2자 이상 20자 이하여야 합니다.";
    }
    return null;
  }

  // 이메일 유효성 검사
  public static validateEmail(email: string): string | null {
    if (!email) {
      return "이메일을 입력해주세요.";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "유효한 이메일 주소를 입력해주세요.";
    }
    return null;
  }

  // 비밀번호 유효성 검사
  public static validatePassword(password: string): string | null {
    if (!password) {
      return "비밀번호를 입력해주세요.";
    }
    if (password.length < 8) {
      return "비밀번호는 8자 이상이어야 합니다.";
    }
    const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
    if (!specialCharRegex.test(password)) {
      return "비밀번호는 최소 하나의 특수문자를 포함해야 합니다.";
    }
    return null;
  }
}
