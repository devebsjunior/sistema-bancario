import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ClienteService } from './cliente.service';
import { environment } from '../../environment/environment';
import { ClienteDTO } from '../models/cliente.model';

describe('ClienteService', () => {
  let service: ClienteService;
  let httpMock: HttpTestingController;
  const API = `${environment.apiUrl}/clientes`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ClienteService]
    });
    service = TestBed.inject(ClienteService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('deve cadastrar um novo cliente', () => {
    const mockCliente: ClienteDTO = { id: 1, nome: 'Cliente Teste' } as any;

    service.cadastrar(mockCliente).subscribe(res => {
      expect(res).toEqual(mockCliente);
    });

    const req = httpMock.expectOne(API);
    expect(req.request.method).toBe('POST');
    req.flush(mockCliente);
  });

  it('deve listar todos os clientes (findAll)', () => {
    const mockClientes: ClienteDTO[] = [{ id: 1, nome: 'C1' }, { id: 2, nome: 'C2' }] as any;

    service.findAll().subscribe(res => {
      expect(res.length).toBe(2);
      expect(res).toEqual(mockClientes);
    });

    const req = httpMock.expectOne(API);
    expect(req.request.method).toBe('GET');
    req.flush(mockClientes);
  });

  it('deve buscar cliente por ID', () => {
    service.findById(10).subscribe();

    const req = httpMock.expectOne(`${API}/10`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('deve realizar um depósito via POST com query parameters', () => {
    const contaId = 123;
    const valor = 50.5;

    service.depositar(contaId, valor).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/contas/${contaId}/deposito?valor=${valor}`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush({});
  });

  it('deve realizar um saque via POST com query parameters', () => {
    const contaId = 123;
    const valor = 20;

    service.sacar(contaId, valor).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/contas/${contaId}/saque?valor=${valor}`);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('deve realizar uma transferência com múltiplos query parameters', () => {
    const origem = 1;
    const destino = '999';
    const valor = 100;

    service.transferir(origem, destino, valor).subscribe();

    const expectedUrl = `${environment.apiUrl}/contas/${origem}/transferir?contaDestino=${destino}&valor=${valor}`;
    const req = httpMock.expectOne(expectedUrl);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('deve listar as transações de uma conta específica', () => {
    const contaId = 456;
    const mockTransacoes = [{ id: 1, tipo: 'PIX' }];

    service.listarTransacoes(contaId).subscribe(res => {
      expect(res).toEqual(mockTransacoes);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/transacoes/conta/${contaId}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockTransacoes);
  });
});