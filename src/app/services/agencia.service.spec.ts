import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AgenciaService } from './agencia.service';
import { environment } from '../../environment/environment';

describe('AgenciaService', () => {
  let service: AgenciaService;
  let httpMock: HttpTestingController;
  const API_URL = `${environment.apiUrl}/agencias`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AgenciaService]
    });

    service = TestBed.inject(AgenciaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('deve ser criado', () => {
    expect(service).toBeTruthy();
  });

  it('deve enviar uma requisição POST para cadastrar uma agência', () => {
    const novaAgencia = { nome: 'Agência Central', numero: '001' };
    const mockResposta = { id: 1, ...novaAgencia };

    service.cadastrar(novaAgencia).subscribe(res => {
      expect(res).toEqual(mockResposta);
    });

    const req = httpMock.expectOne(API_URL);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(novaAgencia);
    req.flush(mockResposta);  
  });

  it('deve enviar uma requisição GET para buscar todas as agências (findAll)', () => {
    const mockAgencias = [
      { id: 1, nome: 'Agência 01' },
      { id: 2, nome: 'Agência 02' }
    ];

    service.findAll().subscribe(agencias => {
      expect(agencias.length).toBe(2);
      expect(agencias).toEqual(mockAgencias);
    });

    const req = httpMock.expectOne(API_URL);
    expect(req.request.method).toBe('GET');
    req.flush(mockAgencias);
  });
});