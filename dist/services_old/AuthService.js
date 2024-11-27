"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const types_1 = require("../types");
const UserRepository_1 = require("../repositories/UserRepository");
const bcrypt = __importStar(require("bcrypt"));
const jwt = __importStar(require("jsonwebtoken"));
class AuthService {
    constructor() {
        this.JWT_SECRET = 'your-secret-key';
        this.userRepository = new UserRepository_1.UserRepository();
    }
    validateAge(birthDate) {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age >= 18;
    }
    signUp(userData) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.validateAge(userData.birthDate)) {
                throw new Error('User must be at least 18 years old');
            }
            const hashedPassword = yield bcrypt.hash(userData.password, 10);
            yield this.userRepository.create(Object.assign(Object.assign({}, userData), { password: hashedPassword, role: userData.role || types_1.UserRole.USER, walletBalance: 0 }));
        });
    }
    login(credentials) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.userRepository.findByEmailForAuth(credentials.email);
            if (!user) {
                throw new Error('User not found');
            }
            const isValidPassword = yield bcrypt.compare(credentials.password, user.password);
            if (!isValidPassword) {
                throw new Error('Invalid password');
            }
            return this.generateToken(user);
        });
    }
    generateToken(user) {
        return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1d' });
    }
}
exports.AuthService = AuthService;
