import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CadastrarClienteComponent } from './cadastrar-cliente.component';
import { ReactiveFormsModule } from '@angular/forms';
import { ClienteService } from '../../../../services/cliente.service';
import { AgenciaService } from '../../../../services/agencia.service';
import { CepService } from '../../../../services/cep.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import Swal from 'sweetalert2';

describe('CadastrarClienteComponent', () => {
  let component: CadastrarClienteComponent;
  let fixture: ComponentFixture<CadastrarClienteComponent>;

  let clienteServiceSpy: jasmine.SpyObj<ClienteService>;
  let agenciaServiceSpy: jasmine.SpyObj<AgenciaService>;
  let cepServiceSpy: jasmine.SpyObj<CepService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    clienteServiceSpy = jasmine.createSpyObj('ClienteService', ['cadastrar']);
    agenciaServiceSpy = jasmine.createSpyObj('AgenciaService', ['findAll']);
    cepServiceSpy = jasmine.createSpyObj('CepService', ['buscar']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    agenciaServiceSpy.findAll.and.returnValue(of([{ id: 1, nome: 'Agência Serrinha' }]));

    await TestBed.configureTestingModule({
      imports: [CadastrarClienteComponent, ReactiveFormsModule],
      providers: [
        { provide: ClienteService, useValue: clienteServiceSpy },
        { provide: AgenciaService, useValue: agenciaServiceSpy },
        { provide: CepService, useValue: cepServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CadastrarClienteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('deve iniciar o formulário como inválido', () => {
    expect(component.clienteForm.valid).toBeFalse();
  });

  it('deve formatar o CPF corretamente enquanto o usuário digita', () => {
    const event = { target: { value: '12345678901' } };
    component.formatarCpf(event);
    expect(event.target.value).toBe('123.456.789-01');
    expect(component.clienteForm.get('cpf')?.value).toBe('123.456.789-01');
  });

  it('deve preencher o endereço automaticamente ao consultar um CEP válido', () => {
    const mockCep = {
      logradouro: 'Rua das Camélias',
      bairro: 'Serrinha',
      localidade: 'Resende',
      uf: 'RJ',
      erro: false
    };
    cepServiceSpy.buscar.and.returnValue(of(mockCep));
    
    component.clienteForm.get('enderecoCliente.cep')?.setValue('27555-000');
    component.consultarCep();

    const endereco = component.clienteForm.get('enderecoCliente')?.value;
    expect(endereco.logradouro).toBe('Rua das Camélias');
    expect(endereco.cidade).toBe('Resende');
  });

  it('deve mostrar aviso de CPF duplicado quando o servidor retornar erro de entrada duplicada', () => {
    component.clienteForm.patchValue({
      nome: 'Edson Belém',
      cpf: '123.456.789-01',
      email: 'edson@serrinha.com',
      senha: 'senha123',
      conta: { numeroConta: '1234', digito: '5', agencia: { id: '1' } },
      enderecoCliente: { logradouro: 'Rua A', numero: '10', bairro: 'Centro', cidade: 'Resende', estado: 'RJ', cep: '27500000' }
    });

    const errorResponse = { message: 'Duplicate entry for key cpf' };
    clienteServiceSpy.cadastrar.and.returnValue(throwError(() => errorResponse));
    const swalSpy = spyOn(Swal, 'fire');

    component.salvar();

    expect(swalSpy).toHaveBeenCalledWith('CPF Duplicado', jasmine.any(String), 'warning');
  });

  it('deve navegar de volta ao dashboard ao cancelar', () => {
    component.cancelar();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('deve exibir erro se o CEP não for encontrado', () => {
    cepServiceSpy.buscar.and.returnValue(of({ erro: true }));
    const swalSpy = spyOn(Swal, 'fire');
    
    component.clienteForm.get('enderecoCliente.cep')?.setValue('00000000');
    component.consultarCep();

    expect(swalSpy).toHaveBeenCalledWith('CEP não encontrado', jasmine.any(String), 'warning');
  });

  it('deve realizar o cadastro com sucesso e navegar para o dashboard', () => {
    const mockClienteSucesso = {
      nome: 'Edson Belém',
      cpf: '12345678901',
      email: 'edson@serrinha.com',
      profile: 'CLIENTE',
      enderecoCliente: { logradouro: 'Rua A', numero: '10', bairro: 'Centro', cidade: 'Resende', estado: 'RJ', cep: '27500000' }
    } as any;

    component.clienteForm.patchValue({
      nome: 'Edson Belém',
      cpf: '123.456.789-01',
      email: 'edson@serrinha.com',
      senha: 'senha123',
      conta: { numeroConta: '1234', digito: '5', agencia: { id: '1' } },
      enderecoCliente: { logradouro: 'Rua A', numero: '10', bairro: 'Centro', cidade: 'Resende', estado: 'RJ', cep: '27500000' }
    });

    clienteServiceSpy.cadastrar.and.returnValue(of(mockClienteSucesso));
    const swalSpy = spyOn(Swal, 'fire');

    component.salvar();

    expect(swalSpy).toHaveBeenCalledWith('Sucesso!', 'Cliente cadastrado.', 'success');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('deve tratar o status 201 como sucesso quando retornado no bloco de erro', () => {
    component.clienteForm.patchValue({
      nome: 'Edson Belém',
      cpf: '123.456.789-01',
      email: 'edson@serrinha.com',
      senha: 'senha123',
      conta: { numeroConta: '1234', digito: '5', agencia: { id: '1' } },
      enderecoCliente: { logradouro: 'Rua A', numero: '10', bairro: 'Centro', cidade: 'Resende', estado: 'RJ', cep: '27500000' }
    });

    const errorResponse = { status: 201 };
    clienteServiceSpy.cadastrar.and.returnValue(throwError(() => errorResponse));
    const swalSpy = spyOn(Swal, 'fire');

    component.salvar();

    expect(swalSpy).toHaveBeenCalledWith('Sucesso!', jasmine.stringMatching(/ajuste o loop/), 'success');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('deve exibir erro genérico quando o servidor falhar sem duplicidade ou status de sucesso', () => {
    component.clienteForm.patchValue({
      nome: 'Edson Belém',
      cpf: '123.456.789-01',
      email: 'edson@serrinha.com',
      senha: 'senha123',
      conta: { numeroConta: '1234', digito: '5', agencia: { id: '1' } },
      enderecoCliente: { logradouro: 'Rua A', numero: '10', bairro: 'Centro', cidade: 'Resende', estado: 'RJ', cep: '27500000' }
    });

    const errorResponse = { status: 500, message: 'Internal Server Error' };
    clienteServiceSpy.cadastrar.and.returnValue(throwError(() => errorResponse));
    const swalSpy = spyOn(Swal, 'fire');

    component.salvar();

    expect(swalSpy).toHaveBeenCalledWith('Erro no Cadastro', jasmine.any(String), 'error');
  });

  it('deve logar erro no console ao falhar a busca por CEP ou Agências', () => {
    const consoleSpy = spyOn(console, 'error');
    agenciaServiceSpy.findAll.and.returnValue(throwError(() => new Error('Falha Agência')));
    
    component.listarAgencias();
    expect(consoleSpy).toHaveBeenCalledWith('Erro ao carregar agências');

    cepServiceSpy.buscar.and.returnValue(throwError(() => new Error('Falha CEP')));
    component.clienteForm.get('enderecoCliente.cep')?.setValue('27555000');
    component.consultarCep();
    expect(consoleSpy).toHaveBeenCalledWith('Erro na busca do CEP');
  });










});