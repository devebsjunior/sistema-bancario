import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';

@Injectable({ providedIn: 'root' })
export class AgenciaService {
 private readonly API = `${environment.apiUrl}/api/admin/agencias`;

  constructor(private http: HttpClient) {}

  cadastrar(agencia: any): Observable<any> {
    return this.http.post<any>(this.API, agencia);
  }
  
  findAll(): Observable<any[]> {
    return this.http.get<any[]>(this.API);
  }
}