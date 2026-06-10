import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { LoginRequest, UsuarioDTO } from '../models/auth.model';
import { environment } from '../../environment/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API = `${environment.apiUrl}/api/auth`;
  private currentUserSubject: BehaviorSubject<UsuarioDTO | null>;
  public currentUser: Observable<UsuarioDTO | null>;

  constructor(private http: HttpClient) {
    const storedUser = localStorage.getItem('user');
    this.currentUserSubject = new BehaviorSubject<UsuarioDTO | null>(storedUser ? JSON.parse(storedUser) : null);
    this.currentUser = this.currentUserSubject.asObservable();
  }

  // login(credentials: LoginRequest) {
  //   const payload = {
  //     login: credentials.email, 
  //     senha: credentials.password
  //   };

  //   return this.http.post<any>(`${this.API}/login`, payload).pipe(
  //     map(user => {
  //       this.currentUserSubject.next(user);

  //       const userStorage = {
  //         id: user.id || 1, 
  //         name: user.nome,  
  //         perfil: user.perfil,
  //         token: user.token || ''
  //       };

  //       localStorage.setItem('user', JSON.stringify(userStorage));
  //       localStorage.setItem('token', user.token);

  //       return user;
  //     })
  //   );
  // }

  login(credentials: LoginRequest) {
    const payload = {
      login: credentials.email,
      senha: credentials.password
    };

    return this.http.post<UsuarioDTO>(`${this.API}/login`, payload).pipe(
      map((user: any) => {
        console.log("DADOS VINDOS DO BACKEND NO LOGIN:", user);

        const usuarioTratado: UsuarioDTO = {
          id: user.id,
          nome: user.nome,
         email: credentials.email,
          status: 'ACTIVE',
          token: user.token,
          perfil: user.perfil
        };

        this.currentUserSubject.next(usuarioTratado);

        localStorage.setItem('user', JSON.stringify(usuarioTratado));
        localStorage.setItem('token', user.token);

        return usuarioTratado;
      })
    );
  }

  logout() {
    localStorage.clear();
    this.currentUserSubject.next(null);
  }

  public get currentUserValue(): UsuarioDTO | null {
    return this.currentUserSubject.value;
  }
}