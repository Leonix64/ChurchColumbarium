import { User } from "./user.model";

export interface LoginRequest {
    username: string;
    password: string;
}

export interface LoginResponse {
    user: User;
    tokens: {
        accessToken: string;
        refreshToken: string;
        accessTokenExpire: string;
        refreshTokenExpire: string;
    };
}

export interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    token: string | null;
}