"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
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
    apis: ["./src/routes/*.ts"], // Path to your route files with TSDoc comments
};
const specs = (0, swagger_jsdoc_1.default)(options);
exports.default = { swaggerUi: swagger_ui_express_1.default, specs };
