const swaggerUi = require("swagger-ui-express");
const swaggereJsdoc = require("swagger-jsdoc");
const userSchemas = require("../component/user");
const diarySchemas = require("../component/diary");
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "malimo Test API",
      version: "1.0.0",
      description: "malimo test API with express",
    },
    servers: [
      {
        url: "http://localhost:8001",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        ...userSchemas,
        ...diarySchemas,
      },
    },
  },
  apis: ["./router/*.ts"],
};

const specs = swaggereJsdoc(options);

module.exports = {
  swaggerUi,
  specs,
};
