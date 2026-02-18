import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PerfilComponent } from './perfil.component';
import { ClienteService } from '../../../../services/cliente.service';
import { AgenciaService } from '../../../../services/agencia.service';
import { of, throwError } from 'rxjs';
import { DecimalPipe } from '@angular/common';

describe('PerfilComponent', () => {
  let component: PerfilComponent;
  let fixture: ComponentFixture<PerfilComponent>;

  let clienteServiceSpy: jasmine.SpyObj<ClienteService>;
  let agenciaServiceSpy: jasmine.SpyObj<AgenciaService>;

  beforeEach(async () => {
    clienteServiceSpy = jasmine.createSpyObj('ClienteService', ['findAll']);
    agenciaServiceSpy = jasmine.createSpyObj('AgenciaService', ['findAll']);

    await TestBed.configureTestingModule({
      imports: [PerfilComponent],
      providers: [
        { provide: ClienteService, useValue: clienteServiceSpy },
        { provide: AgenciaService, useValue: agenciaServiceSpy },
        DecimalPipe
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PerfilComponent);
    component = fixture.componentInstance;
  });

  it('deve criar o componente', () => {
    clienteServiceSpy.findAll.and.returnValue(of([]));
    agenciaServiceSpy.findAll.and.returnValue(of([]));

    fixture.detectChanges();
    expect(component).toBeTruthy();
  });


  it('deve tratar erro caso a chamada de clientes falhe', () => {
    spyOn(console, 'error');
    clienteServiceSpy.findAll.and.returnValue(throwError(() => new Error('Erro API')));
    agenciaServiceSpy.findAll.and.returnValue(of([{ id: 1 }]));

    fixture.detectChanges();

    expect(component.totalClientes).toBe(0);
    expect(console.error).toHaveBeenCalledWith("Erro ao carregar clientes", jasmine.any(Error));
  });

  it('deve tratar erro caso a chamada de agências falhe', () => {
    spyOn(console, 'error');

    clienteServiceSpy.findAll.and.returnValue(of([{ id: 1 }] as any));
    agenciaServiceSpy.findAll.and.returnValue(throwError(() => new Error('Erro API Agência')));

    fixture.detectChanges();

    expect(component.totalAgencias).toBe(0);
    expect(console.error).toHaveBeenCalledWith("Erro ao carregar agências", jasmine.any(Error));
  });

});