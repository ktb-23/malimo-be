module.exports = {
  SaveDiary: {
    type: "object",
    properties: {
      date: {
        type: "string",
        example: "2024.09.05",
      },
      contents: {
        type: "string",
        example: "나는야 퉁퉁이 골목 대장 퉁퉁이 ",
      },
    },
    required: ["date", "contents"],
  },
};
