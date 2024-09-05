module.exports = {
  Signup: {
    type: "object",
    properties: {
      nickname: {
        type: "string",
        example: "ktb23",
      },
      email: {
        type: "string",
        example: "ktb23@kakao.com",
      },
      password: {
        type: "string",
        example: "!ktb1234",
      },
    },
    required: ["nickname", "email", "password"],
  },
  Login: {
    type: "object",
    properties: {
      email: {
        type: "string",
        example: "ktb23@kakao.com",
      },
      password: {
        type: "string",
        example: "!ktb1234",
      },
    },
    required: ["email", "password"],
  },
};
