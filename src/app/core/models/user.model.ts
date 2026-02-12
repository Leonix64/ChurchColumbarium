export interface User {
    id: string;
    username: string;
    email: string;
    fullName: string;
    role: 'admin' | 'seller' | 'viewer';
    phone?: string;
    lastLogin?: Date;
    isActive?: boolean;
    createdAt?: Date;
}

export interface UpdateProfileRequest {
    fullName?: string;
    email?: string;
    phone?: string;
}
