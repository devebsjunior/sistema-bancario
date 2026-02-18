import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CepService } from './cep.service';
import { environment } from '../../environment/environment';

describe('CepService', () => {
  let service: CepService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CepService]
    });
    service = TestBed.inject(CepService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('deve ser criado', () => {
    expect(service).toBeTruthy();
  });

  it('deve limpar o CEP e realizar a busca via GET', () => {
    const cepComMascara = '12345-678';
    const cepLimpo = '12345678';
    const mockResponse = { logradouro: 'Rua de Teste', bairro: 'Centro' };

    service.buscar(cepComMascara).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiViaCep}/${cepLimpo}/json/`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('deve lidar com CEP contendo outros caracteres especiais', () => {
    const cepSujo = '12.345.678/X';
    const cepLimpo = '12345678';

    service.buscar(cepSujo).subscribe();

    const req = httpMock.expectOne(`${environment.apiViaCep}/${cepLimpo}/json/`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });
});