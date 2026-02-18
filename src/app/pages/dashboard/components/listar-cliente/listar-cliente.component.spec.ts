import { ComponentFixture, flush, TestBed } from '@angular/core/testing';
import { ListarClienteComponent } from './listar-cliente.component';
import { ClienteService } from '../../../../services/cliente.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { ClienteDTO } from '../../../../models/cliente.model';
import { fakeAsync, tick } from '@angular/core/testing';
import * as jspdf from 'jspdf'

describe('ListarClienteComponent', () => {
  let component: ListarClienteComponent;
  let fixture: ComponentFixture<ListarClienteComponent>;

  let clienteServiceSpy: jasmine.SpyObj<ClienteService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockClientes: ClienteDTO[] = [
    {
      idCliente: 1,
      nome: 'Edson',
      cpf: '123.456.789-00',
      email: 'edson@teste.com',
      profile: 'CLIENTE',
      enderecoCliente: {
        logradouro: 'Rua A',
        numero: '10',
        bairro: 'Centro',
        cidade: 'Resende',
        estado: 'RJ',
        cep: '27500000',
        complemento: ''
      },
      conta: { id: 10, saldo: 1000 } as any
    },
    {
      idCliente: 2,
      nome: 'Edson',
      cpf: '987.654.321-11',
      email: 'edson@teste.com',
      profile: 'CLIENTE',
      enderecoCliente: {
        logradouro: 'Rua B',
        numero: '20',
        bairro: 'Serrinha',
        cidade: 'Resende',
        estado: 'RJ',
        cep: '27500000',
        complemento: ''
      },
      conta: { id: 11, saldo: 5000 } as any
    }
  ];

  beforeEach(async () => {
    clienteServiceSpy = jasmine.createSpyObj('ClienteService', ['findAll', 'listarTransacoes']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    clienteServiceSpy.findAll.and.returnValue(of(mockClientes));
    clienteServiceSpy.listarTransacoes.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [ListarClienteComponent, FormsModule],
      providers: [
        { provide: ClienteService, useValue: clienteServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ListarClienteComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('deve criar o componente e carregar clientes no início', () => {
    expect(component).toBeTruthy();
    expect(clienteServiceSpy.findAll).toHaveBeenCalled();
    expect(component.clientes.length).toBe(2);
  });

  it('deve carregar a lista de clientes ao iniciar o componente', () => {
    const mockClientes = [
      {
        id: 1,
        nome: 'Edson Belem',
        email: 'edson@teste.com',
        cpf: '12345678901',
        profile: 'CLIENTE',
        conta: { saldo: 1000 }
      }
    ];

    clienteServiceSpy.findAll.and.returnValue(of(mockClientes as any));
    component.ngOnInit();
    expect(clienteServiceSpy.findAll).toHaveBeenCalled();
    expect(component.clientes.length).toBe(1);
    expect(component.clientes[0].nome).toBe('Edson Belem');
  });

  it('deve registrar erro no console e exibir alerta quando a busca de clientes falhar', () => {
    const consoleSpy = spyOn(console, 'error');
    clienteServiceSpy.findAll.and.returnValue(throwError(() => new Error('Erro de Conexão')));
    const swalSpy = spyOn(Swal, 'fire');
    component.carregarClientes();
    expect(consoleSpy).toHaveBeenCalled();
    expect(swalSpy).toHaveBeenCalledWith('Erro', jasmine.any(String), 'error');
  });

  it('deve navegar para a tela de cadastro ao clicar em novo cliente', () => {
    component.novoCliente();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard/cadastrar-cliente']);
  });

  it('deve agrupar transações do extrato corretamente por data', () => {
    const mockTransacoes = [
      { valor: 100, dataHora: '2026-02-17T10:00:00', tipo: 'PIX' },
      { valor: 50, dataHora: '2026-02-17T15:00:00', tipo: 'SAQUE' }
    ];

    component.agruparTransacoes(mockTransacoes);

    expect(component.transacoesAgrupadas.length).toBe(1);
    expect(component.transacoesAgrupadas[0].data).toBe('17/02/2026');
    expect(component.transacoesAgrupadas[0].itens.length).toBe(2);
  });

  it('deve registrar erro no console e exibir alerta quando a busca de clientes falhar', () => {
    const consoleSpy = spyOn(console, 'error');
    clienteServiceSpy.findAll.and.returnValue(throwError(() => new Error('Erro de Conexão')));
    const swalSpy = spyOn(Swal, 'fire');
    component.carregarClientes();
    expect(consoleSpy).toHaveBeenCalled();
    expect(swalSpy).toHaveBeenCalledWith('Erro', jasmine.any(String), 'error');
  });

  it('deve navegar para a tela de cadastro ao clicar em novo cliente', () => {
    component.novoCliente();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard/cadastrar-cliente']);
  });

  it('deve agrupar transações do extrato corretamente por data', () => {
    const mockTransacoes = [
      { valor: 100, dataHora: '2026-02-17T10:00:00', tipo: 'PIX' },
      { valor: 50, dataHora: '2026-02-17T15:00:00', tipo: 'SAQUE' }
    ];
    component.agruparTransacoes(mockTransacoes);
    expect(component.transacoesAgrupadas.length).toBe(1);
    expect(component.transacoesAgrupadas[0].data).toBe('17/02/2026');
    expect(component.transacoesAgrupadas[0].itens.length).toBe(2);
  });

  it('deve carregar o extrato do cliente e exibir o modal ao clicar em abrir extrato', () => {
    const mockEdson = { nome: 'Edson Belem', conta: { idConta: 10 } };
    const mockTransacoes = [{ valor: 100, tipo: 'PIX', dataHora: new Date().toISOString() }];

    clienteServiceSpy.listarTransacoes.and.returnValue(of(mockTransacoes));
    const exibirModalSpy = spyOn<any>(component, 'exibirModal');

    component.abrirExtrato(mockEdson);

    expect(component.clienteSelecionado).toEqual(mockEdson);
    expect(clienteServiceSpy.listarTransacoes).toHaveBeenCalledWith(10);
    expect(component.transacoesOriginais).toEqual(mockTransacoes);
    expect(exibirModalSpy).toHaveBeenCalled();
  });

  it('deve exibir alerta de erro quando a busca por transações falhar', () => {
    const mockEdson = { conta: { id: 20 } };
    clienteServiceSpy.listarTransacoes.and.returnValue(throwError(() => new Error('Erro API')));
    const swalSpy = spyOn(Swal, 'fire');

    component.abrirExtrato(mockEdson);

    expect(swalSpy).toHaveBeenCalledWith('Erro', 'Falha ao buscar as transações.', 'error');
  });

  it('deve filtrar transações por tipo específico', () => {
    component.transacoesOriginais = [
      { tipo: 'PIX', valor: 50, dataHora: new Date().toISOString() },
      { tipo: 'SAQUE', valor: 20, dataHora: new Date().toISOString() }
    ];

    component.filtroTipo = 'PIX';
    component.aplicarFiltros();

    expect(component.transacoesAgrupadas[0].itens.length).toBe(1);
    expect(component.transacoesAgrupadas[0].itens[0].tipo).toBe('PIX');
  });

  it('deve filtrar transações em um período customizado de datas', () => {
    const dataDentro = '2026-02-10T10:00:00';
    const dataFora = '2026-01-01T10:00:00';

    component.transacoesOriginais = [
      { tipo: 'DEPOSITO', valor: 100, dataHora: dataDentro },
      { tipo: 'SAQUE', valor: 50, dataHora: dataFora }
    ];

    component.periodoSelecionado = 'custom';
    component.dataInicio = '2026-02-01';
    component.dataFim = '2026-02-15';

    component.aplicarFiltros();

    expect(component.transacoesAgrupadas.length).toBe(1);
    expect(component.transacoesAgrupadas[0].itens[0].dataHora).toBe(dataDentro);
  });

  it('deve interromper a execução se o elemento do extrato ou o cliente não existirem', () => {
    spyOn(document, 'getElementById').and.returnValue(null);
    component.clienteSelecionado = null;

    const resultado = component.exportarPDF();

    expect(resultado).toBeUndefined();
  });

  it('deve formatar corretamente o texto do período customizado para o PDF', async () => {
    const div = document.createElement('div');
    div.id = 'secaoExtratoAdmin';
    document.body.appendChild(div);

    component.clienteSelecionado = { nome: 'Edson', conta: { idConta: 1, agencia: { numeroAgencia: '001' }, numeroConta: '123' } };
    component.periodoSelecionado = 'custom';
    component.dataInicio = '2026-02-01';
    component.dataFim = '2026-02-10';

    spyOn(Swal, 'fire').and.callFake((options: any) => {
      if (options.didOpen) options.didOpen();
      return Promise.resolve({ isConfirmed: true } as any);
    });

    (window as any).html2canvas = () => Promise.resolve(document.createElement('canvas'));

    await component.exportarPDF();

    expect(Swal.fire).toHaveBeenCalled();
    document.body.removeChild(div);
    delete (window as any).html2canvas;
  });

  it('deve identificar o ID da conta a partir de diferentes propriedades do objeto cliente', () => {
    const clienteComIdAlternativo = { conta: { id: 500 } };
    clienteServiceSpy.listarTransacoes.and.returnValue(of([]));

    component.abrirExtrato(clienteComIdAlternativo);

    expect(clienteServiceSpy.listarTransacoes).toHaveBeenCalledWith(500);
  });

  it('deve inicializar e exibir o modal do Bootstrap quando o elemento existir', () => {
    const modalDiv = document.createElement('div');
    modalDiv.id = 'modalExtrato';
    document.body.appendChild(modalDiv);

    const modalSpy = jasmine.createSpyObj('Modal', ['show']);
    (window as any).bootstrap = {
      Modal: Object.assign(
        jasmine.createSpy('Modal').and.returnValue(modalSpy),
        { getInstance: jasmine.createSpy('getInstance').and.returnValue(null) }
      )
    };

    (component as any).exibirModal();

    expect(modalSpy.show).toHaveBeenCalled();
    document.body.removeChild(modalDiv);
  });

  it('deve formatar o texto do período padrão quando não for selecionado um período customizado', async () => {
    const div = document.createElement('div');
    div.id = 'secaoExtratoAdmin';
    document.body.appendChild(div);

    component.clienteSelecionado = {
      nome: 'Edson Belem',
      cpf: '123',
      conta: { idConta: 1, agencia: { numeroAgencia: '001' }, numeroConta: '123', saldo: 500 }
    };
    component.periodoSelecionado = '7';

    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));
    const mockCanvas = document.createElement('canvas');
    mockCanvas.width = 100;
    mockCanvas.height = 100;
    (window as any).html2canvas = () => Promise.resolve(mockCanvas);

    await component.exportarPDF();

    expect(Swal.fire).toHaveBeenCalled();
    document.body.removeChild(div);
    delete (window as any).html2canvas;
  });

});