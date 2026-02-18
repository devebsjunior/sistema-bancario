import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { AuthService } from '../../services/auth.service';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { of } from 'rxjs';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockAdmin: any = {
    name: 'Edson Admin',
    perfil: 'ADMIN',
    token: 'header.' + btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })) + '.signature'
  };

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['logout'], {
      currentUserValue: mockAdmin
    });
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [DashboardComponent, CommonModule, RouterOutlet],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  it('deve criar o componente e carregar dados do admin', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(component.adminData?.name).toBe('Edson Admin');
  });

  it('deve ocultar a sidebar automaticamente em telas menores que 768px', () => {
    (window as any).innerWidth = 500;
    component.ngOnInit();
    expect(component.sidebarVisible).toBeFalse();
  });

  it('deve navegar para a rota correta e fechar sidebar no mobile ao clicar em um link', () => {
    (window as any).innerWidth = 500;
    component.sidebarVisible = true;
    
    component.navigate('perfil');
    
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard/perfil']);
    expect(component.sidebarVisible).toBeFalse();
  });

  it('deve atualizar o relógio e a data a cada segundo', fakeAsync(() => {
    fixture.detectChanges(); 
    const horaInicial = component.currentTime;
    
    tick(1000);
    expect(component.currentTime).not.toBe(horaInicial);
    expect(component.currentDate).toContain('FEIRA'); 
    component.ngOnDestroy(); 
  }));

  it('deve realizar logout e navegar para login quando o tempo de sessão expirar', fakeAsync(() => {
    const expCurta = Math.floor(Date.now() / 1000) + 2;
    const tokenCurto = 'header.' + btoa(JSON.stringify({ exp: expCurta })) + '.signature';
    
    component.adminData = { ...mockAdmin, token: tokenCurto };
    component.startCountdown();
    
    tick(3000); 
    expect(authServiceSpy.logout).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  }));

  it('deve limpar o timer do relógio ao destruir o componente', () => {
    const spyClear = spyOn(window, 'clearInterval');
    fixture.detectChanges();
    
    component.ngOnDestroy();
    
    expect(spyClear).toHaveBeenCalled();
  });
});