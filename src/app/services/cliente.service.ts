import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';
import { ClienteDTO } from '../models/cliente.model';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private readonly API = `${environment.apiUrl}/clientes`;

  constructor(private http: HttpClient) { }

  cadastrar(cliente: ClienteDTO): Observable<ClienteDTO> {
    return this.http.post<ClienteDTO>(this.API, cliente);
  }

  findAll(): Observable<ClienteDTO[]> {
    return this.http.get<ClienteDTO[]>(this.API);
  }

  findById(id: number | string): Observable<any> {
    return this.http.get<any>(`${this.API}/${id}`);
  }

  depositar(contaId: number, valor: number): Observable<any> {
    return this.http.post(`${environment.apiUrl}/contas/${contaId}/deposito?valor=${valor}`, {});
  }

  sacar(contaId: number, valor: number): Observable<any> {
    return this.http.post(`${environment.apiUrl}/contas/${contaId}/saque?valor=${valor}`, {});
  }

  transferir(contaOrigemId: number, contaDestino: string, valor: number): Observable<any> {
    return this.http.post(`${environment.apiUrl}/contas/${contaOrigemId}/transferir?contaDestino=${contaDestino}&valor=${valor}`, {});
  }

  listarTransacoes(contaId: number): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/transacoes/conta/${contaId}`);
  }

}