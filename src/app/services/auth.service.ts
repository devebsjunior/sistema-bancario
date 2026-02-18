import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, map, Observable, tap } from 'rxjs';
import { LoginRequest, UsuarioDTO } from '../models/auth.model';
import { environment } from '../../environment/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API = `${environment.apiUrl}/usuarios`;
  private currentUserSubject: BehaviorSubject<UsuarioDTO | null>;
  public currentUser: Observable<UsuarioDTO | null>;

  constructor(private http: HttpClient) {
    const storedUser = localStorage.getItem('user');
    this.currentUserSubject = new BehaviorSubject<UsuarioDTO | null>(storedUser ? JSON.parse(storedUser) : null);
    this.currentUser = this.currentUserSubject.asObservable();
  }


  login(credentials: any) {
    return this.http.post<any>(`${this.API}/login`, credentials).pipe(
      map(user => {
        this.currentUserSubject.next(user);
        const userStorage = {
          id: user.id,
          name: user.name,
          perfil: user.perfil,
          token: user.token
        };

        localStorage.setItem('user', JSON.stringify(userStorage));
        localStorage.setItem('token', user.token);

        return user;
      })
    );
  }

  logout() {
    localStorage.clear();
  }

  public get currentUserValue(): UsuarioDTO | null {
    return this.currentUserSubject.value;
  }
}