import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';

@Injectable({
  providedIn: 'root'
})
export class CepService {
  private readonly API = environment.apiViaCep;

  constructor(private http: HttpClient) { }

  buscar(cep: string): Observable<any> {
    const cepLimpo = cep.replace(/\D/g, '');
    return this.http.get(`${this.API}/${cepLimpo}/json/`);
  }
}