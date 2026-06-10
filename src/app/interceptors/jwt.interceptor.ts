import { HttpInterceptorFn } from '@angular/common/http';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
    const token = localStorage.getItem('token');
    console.log('--- INTERCEPTOR ANGULAR EXECUTADO ---');
    console.log('Token encontrado no LocalStorage:', token);
    if (token) {
        req = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
        console.log('Headers da requisição após o clone:', req.headers.get('Authorization'));
    }

    return next(req);
};