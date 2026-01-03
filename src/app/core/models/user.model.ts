export interface User {
    id: string;
    username: string;
    email: string;
    fullName: string;
    role: 'admin' | 'seller' | 'viewer';
    lastLogin?: Date;
}