import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth.service';
import { AlertService } from '../../services/alert.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { UsuarioDTO } from '../../models/auth.model';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let alertServiceSpy: jasmine.SpyObj<AlertService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);
    alertServiceSpy = jasmine.createSpyObj('AlertService', ['successToast', 'errorAlert']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent, FormsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: AlertService, useValue: alertServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('deve criar o componente de login', () => {
    expect(component).toBeTruthy();
  });

  it('deve exibir alerta de erro quando as credenciais forem inválidas', () => {
    authServiceSpy.login.and.returnValue(throwError(() => new Error('Erro')));

    component.onLogin();

    expect(alertServiceSpy.errorAlert).toHaveBeenCalledWith(
      'Falha no Acesso',
      'Verifique suas credenciais.'
    );
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('deve redirecionar para o perfil ADMIN quando o perfil do usuário for ADMIN', fakeAsync(() => {
    const mockUser: UsuarioDTO = {
      name: 'Edson',
      email: 'edson@belem.com',
      perfil: 'ADMIN',
      token: '123',
      status: 'ATIVO'  
    };

    authServiceSpy.login.and.returnValue(of(mockUser));
    component.loginForm = { email: 'edson@belem.com', password: '123' };
    component.onLogin();

    expect(alertServiceSpy.successToast).toHaveBeenCalledWith('Bem-vindo, Edson!');

    tick(1200);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard/perfil']);
  }));

  it('deve redirecionar para home-cliente quando o perfil do usuário for CLIENTE', fakeAsync(() => {
    const mockUser: UsuarioDTO = {
      name: 'Edson',
      email: 'edson@belem.com',
      perfil: 'CLIENTE',
      token: '456',
      status: 'ATIVO' 
    };

    authServiceSpy.login.and.returnValue(of(mockUser));

    component.onLogin();

    tick(1200);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/home-cliente']);
  }));

});