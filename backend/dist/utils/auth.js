"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.comparePassword = comparePassword;
exports.signJWT = signJWT;
exports.verifyJWT = verifyJWT;
const jose_1 = require("jose");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const SECRET_KEY = process.env.JWT_SECRET || "super-secret-jwt-key-change-in-production";
const key = new TextEncoder().encode(SECRET_KEY);
function hashPassword(password) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield bcryptjs_1.default.hash(password, 10);
    });
}
function comparePassword(plain, hashed) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield bcryptjs_1.default.compare(plain, hashed);
    });
}
function signJWT(payload) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield new jose_1.SignJWT(payload)
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setExpirationTime("24h")
            .sign(key);
    });
}
function verifyJWT(token) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { payload } = yield (0, jose_1.jwtVerify)(token, key, {
                algorithms: ["HS256"],
            });
            return payload;
        }
        catch (error) {
            return null;
        }
    });
}
