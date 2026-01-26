export interface User {
    id: number;
    username: string;
    email?: string;
    password_hash: string;
    created_at: Date;
}

export interface CreateUserRequest {
    username: string;
    email?: string;
    password: string;
}

export interface LoginRequest {
    username: string;
    password: string;
}

export interface AuthResponse {
    token: string;
    user: User;
}
