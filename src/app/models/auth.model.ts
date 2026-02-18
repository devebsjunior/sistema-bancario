export interface LoginRequest {
    email: string;
    password?: string; 
}

export interface UsuarioDTO {
    id?: number;
    name: string;
    email: string;
    status: string;
    token?: string;
    dataCreated?: string;
    dataModified?: string;
    perfil: 'ADMIN' | 'CLIENTE';
    password?: string;
}