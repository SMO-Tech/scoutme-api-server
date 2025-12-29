import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

// Swagger config
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "ScoutMe API",
      version: "1.0.0",
      description: "API documentation for ScoutMe Online backend",
    },
    servers: [
      {
        url: "http://localhost:3000",
      },
    ],
  },
  apis: ["./src/routes/*.ts"], // Path to your route files with TSDoc 
};

const specs = swaggerJsdoc(options);

export default { swaggerUi, specs };
