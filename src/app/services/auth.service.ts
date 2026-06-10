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
      login: credentials.email, // Aqui vai o número da conta digitado na tela
      senha: credentials.password
    };

    return this.http.post<UsuarioDTO>(`${this.API}/login`, payload).pipe(
      map((user: any) => {
        // Cria o objeto adaptando a resposta crua do Java para o DTO do Angular
        const usuarioTratado: UsuarioDTO = {
          nome: user.nome,
          email: '', // O Java não mandou e-mail, deixamos vazio para não quebrar o compilador
          status: 'ACTIVE',
          token: user.token,
          perfil: user.perfil // Recebe 'ADMIN' ou 'CLIENTE' direto do Java
        };

        // Notifica o BehaviorSubject com os dados tratados
        this.currentUserSubject.next(usuarioTratado);

        // Salva no LocalStorage o objeto estruturado e o Token string
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