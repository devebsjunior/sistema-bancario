import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { environment } from '../../environment/environment';
import { HttpClient } from '@angular/common/http';

describe('AuthService', () => {
	let service: AuthService;
	let httpMock: HttpTestingController;
	const API = `${environment.apiUrl}/usuarios`;

	beforeEach(() => {
		localStorage.clear();
		TestBed.configureTestingModule({
			imports: [HttpClientTestingModule],
			providers: [AuthService]
		});
		service = TestBed.inject(AuthService);
		httpMock = TestBed.inject(HttpTestingController);
	});

	afterEach(() => {
		httpMock.verify();
		localStorage.clear();
	});

	it('deve inicializar o currentUserSubject com null se não houver usuario no localStorage', () => {
		expect(service.currentUserValue).toBeNull();
	});

	it('deve inicializar o currentUserSubject com dados do localStorage se existirem', () => {
		const mockUser = { id: 1, name: 'USER_TEST', email: 'test@test.com', status: 'ATIVO', perfil: 'ADMIN' };
		localStorage.setItem('user', JSON.stringify(mockUser));

		const httpClient = TestBed.inject(HttpClient);
		const newService = new AuthService(httpClient);

		expect(newService.currentUserValue).toEqual(jasmine.objectContaining({
			id: 1,
			name: 'USER_TEST'
		}));
	});

	it('deve realizar login, atualizar subject e persistir no localStorage', () => {
		const credentials = { email: 'login@test.com', senha: '123' };
		const mockResponse = { id: 99, name: 'AUTH_USER', email: 'auth@test.com', status: 'ATIVO', perfil: 'USER', token: 'secret-token' };

		service.login(credentials).subscribe(user => {
			expect(user).toEqual(jasmine.objectContaining({
				id: 99,
				token: 'secret-token'
			}));
			expect(service.currentUserValue).toEqual(jasmine.objectContaining({
				token: 'secret-token'
			}));
			expect(localStorage.getItem('token')).toBe('secret-token');
		});

		const req = httpMock.expectOne(`${API}/login`);
		expect(req.request.method).toBe('POST');
		req.flush(mockResponse);
	});

	it('deve limpar o localStorage ao realizar logout', () => {
		localStorage.setItem('token', '123');
		service.logout();
		expect(localStorage.length).toBe(0);
	});

	it('deve retornar o valor atual do usuario via getter', () => {
		const mockUser = { id: 1, name: 'Edson' } as any;
		(service as any).currentUserSubject.next(mockUser);
		expect(service.currentUserValue).toEqual(mockUser);
	});
});