import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HomeClienteComponent } from './home-cliente.component';
import { AuthService } from '../../../services/auth.service';
import { ClienteService } from '../../../services/cliente.service';
import { AlertService } from '../../../services/alert.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, DatePipe } from '@angular/common';

describe('HomeClienteComponent', () => {
  let component: HomeClienteComponent;
  let fixture: ComponentFixture<HomeClienteComponent>;

  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let clienteServiceSpy: jasmine.SpyObj<ClienteService>;
  let alertServiceSpy: jasmine.SpyObj<AlertService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockCliente = {
    id: 1,
    nome: 'edson',
    conta: { idConta: 10, numeroConta: '12345', digito: '6', saldo: 1000 }
  };

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['logout'], {
      currentUserValue: { id: 1, name: 'edson' }
    });
    clienteServiceSpy = jasmine.createSpyObj('ClienteService', [
      'findById', 'listarTransacoes', 'depositar', 'sacar', 'transferir'
    ]);
    alertServiceSpy = jasmine.createSpyObj('AlertService', ['successToast', 'errorAlert']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    clienteServiceSpy.findById.and.returnValue(of(mockCliente));
    clienteServiceSpy.listarTransacoes.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [HomeClienteComponent, FormsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ClienteService, useValue: clienteServiceSpy },
        { provide: AlertService, useValue: alertServiceSpy },
        { provide: Router, useValue: routerSpy },
        CurrencyPipe,
        DatePipe
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HomeClienteComponent);
    component = fixture.componentInstance;
  });

  it('deve carregar dados do cliente e extrato ao iniciar', () => {
    fixture.detectChanges();
    expect(clienteServiceSpy.findById).toHaveBeenCalledWith(1);
    expect(clienteServiceSpy.listarTransacoes).toHaveBeenCalledWith(10);
    expect(component.cliente.nome).toBe('edson');
  });

  it('deve aplicar filtros de período corretamente (Últimos 3 dias)', () => {
    fixture.detectChanges();
    component.periodoSelecionado = '3';
    component.aplicarFiltros();
    expect(component.transacoesAgrupadas).toBeDefined();
  });

  it('deve disparar erro se o valor do depósito for zero ou negativo', () => {
    component.cliente = mockCliente;
    component.valorOperacao = 0;
    component.confirmarDeposito();
    expect(alertServiceSpy.errorAlert).toHaveBeenCalledWith('Valor Inválido', jasmine.any(String));
  });

  it('deve tratar erro na transferência (Saldo Insuficiente/Conta Inexistente)', () => {
    fixture.detectChanges();
    component.contaDestino = '9999';
    component.valorOperacao = 5000;
    clienteServiceSpy.transferir.and.returnValue(throwError(() => ({ error: 'Saldo insuficiente' })));

    component.confirmarTransferencia();

    expect(alertServiceSpy.errorAlert).toHaveBeenCalledWith('Falha no PIX', jasmine.any(String));
  });

  it('deve atualizar o relógio a cada segundo (fakeAsync)', fakeAsync(() => {
    fixture.detectChanges();
    const horaInicial = component.currentTime;
    tick(1000);
    expect(component.currentTime).not.toBe(horaInicial);
    component.ngOnDestroy();
  }));

  it('deve exportar o arquivo HTML com os dados do cliente selecionado', () => {
    fixture.detectChanges();
    const div = document.createElement('div');
    div.id = 'secaoExtrato';
    div.innerHTML = '<span>Teste de Extrato</span>';
    document.body.appendChild(div);

    const createSpy = spyOn(window.URL, 'createObjectURL').and.returnValue('blob:url');
    const revokeSpy = spyOn(window.URL, 'revokeObjectURL');

    component.exportarHtml();

    expect(createSpy).toHaveBeenCalled();
    document.body.removeChild(div);
  });

  it('deve realizar saque e fechar o modal no sucesso', () => {
    component.cliente = mockCliente;
    component.valorOperacao = 100;
    clienteServiceSpy.sacar.and.returnValue(of({}));

    const btnFake = document.createElement('button');
    const clickSpy = spyOn(btnFake, 'click');

    spyOn(document, 'getElementById').and.callFake((id: string) => {
      if (id === 'closeSaque') return btnFake;
      return null;
    });

    component.confirmarSaque();
    fixture.detectChanges();

    expect(clienteServiceSpy.sacar).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
  });

  it('deve carregar o cliente e o extrato quando houver um usuário logado com ID', () => {
    const mockEdson = {
      id: 1,
      nome: 'Edson',
      conta: { idConta: 10, saldo: 595.00 }
    };
    const mockTransacoesEdson = [
      { id: 1, tipo: 'DEPOSITO', valor: 120, dataHora: new Date().toISOString() }
    ];

    clienteServiceSpy.findById.and.returnValue(of(mockEdson));
    clienteServiceSpy.listarTransacoes.and.returnValue(of(mockTransacoesEdson));

    fixture.detectChanges();

    expect(clienteServiceSpy.findById).toHaveBeenCalledWith(1);
    expect(component.cliente).toEqual(mockEdson);
    expect(clienteServiceSpy.listarTransacoes).toHaveBeenCalledWith(10);
    expect(component.transacoesOriginais.length).toBe(1);
  });

  it('deve logar erro no console quando a busca do cliente falhar', () => {
    const consoleSpy = spyOn(console, 'error');
    clienteServiceSpy.findById.and.returnValue(throwError(() => new Error('Erro API')));
    fixture.detectChanges();
    expect(consoleSpy).toHaveBeenCalledWith("Erro ao carregar cliente", jasmine.any(Error));
  });

  it('não deve buscar o cliente se o ID do usuário logado for inexistente', () => {
    const currentUserSpy = Object.getOwnPropertyDescriptor(authServiceSpy, 'currentUserValue')?.get as jasmine.Spy;
    currentUserSpy.and.returnValue(null);
    fixture.detectChanges();
    expect(clienteServiceSpy.findById).not.toHaveBeenCalled();
  });

  it('deve garantir que o construtor e as variáveis iniciais sejam computados no coverage', () => {
    fixture.detectChanges();
    expect(component.countdownText).toBe('00:00');
    expect(component.valorOperacao).toBe(0);
    expect(component.periodoSelecionado).toBe('3');
    expect(component.transacoes).toEqual([]);
    expect(component.transacoesAgrupadas).toEqual([]);
  });

  it('deve cobrir as variáveis iniciais e a lógica do iniciarTimer', fakeAsync(() => {
    const expiraEm = Math.floor(Date.now() / 1000) + 5;
    const tokenFake = `header.${btoa(JSON.stringify({ exp: expiraEm }))}.signature`;
    spyOn(localStorage, 'getItem').and.returnValue(tokenFake);
    fixture.detectChanges();
    component.iniciarTimer();

    expect(component.countdownText).toBeDefined();
    expect(component.valorOperacao).toBe(0);
    expect(component.periodoSelecionado).toBe('3');
    expect(component.transacoes).toEqual([]);

    tick(1000);
    fixture.detectChanges();
    expect(component.countdownText).not.toBe('00:00');

    tick(6000);
    fixture.detectChanges();

    expect(authServiceSpy.logout).toHaveBeenCalled();
    expect(component.countdownText).toBe('00:00');

    component.ngOnDestroy();
  }));

  it('deve cobrir o cenário onde não existe token no localStorage', () => {
    spyOn(localStorage, 'getItem').and.returnValue(null);
    component.iniciarTimer();
    expect(component.countdownText).toBe('00:00');
  });

  it('deve inicializar as propriedades do componente com valores padrão', () => {
    fixture.detectChanges();

    expect(component.countdownText).toBe('00:00');
    expect(component.valorOperacao).toBe(0);
    expect(component.periodoSelecionado).toBe('3');
    expect(component.transacoesAgrupadas).toEqual([]);
    expect(component.cliente).toBeDefined();
    expect(component.cliente.nome.toLowerCase()).toBe('edson');
  });

  it('deve processar o token de autenticação e atualizar o contador de sessão', fakeAsync(() => {
    const dezMinutosNoFuturo = Math.floor(Date.now() / 1000) + 600;
    const mockToken = `header.${btoa(JSON.stringify({ exp: dezMinutosNoFuturo }))}.signature`;
    spyOn(localStorage, 'getItem').and.returnValue(mockToken);

    component.iniciarTimer();
    tick(1000);
    fixture.detectChanges();

    expect(component.countdownText).not.toBe('00:00');
    component.ngOnDestroy();
  }));

  it('deve executar o procedimento de logout quando o token de sessão expirar', fakeAsync(() => {
    const tempoExpirado = Math.floor(Date.now() / 1000) - 60;
    const mockToken = `header.${btoa(JSON.stringify({ exp: tempoExpirado }))}.signature`;
    spyOn(localStorage, 'getItem').and.returnValue(mockToken);

    component.iniciarTimer();
    tick(1000);

    expect(authServiceSpy.logout).toHaveBeenCalled();
    component.ngOnDestroy();
  }));

  it('deve gerenciar operações de depósito e atualizar dados da conta em caso de sucesso', () => {
    component.cliente = { conta: { id: 10, idConta: 10 } };
    component.valorOperacao = 500;
    clienteServiceSpy.depositar.and.returnValue(of({}));

    const mockButton = document.createElement('button');
    const clickSpy = spyOn(mockButton, 'click');
    spyOn(document, 'getElementById').and.callFake((id) => {
      if (id === 'closeDeposito') return mockButton;
      return null;
    });
    component.confirmarDeposito();
    expect(clienteServiceSpy.depositar).toHaveBeenCalledWith(10, 500);
    expect(clickSpy).toHaveBeenCalled();
    expect(component.valorOperacao).toBe(0);
  });

  it('deve registrar erro no console quando a operação de depósito falhar', () => {
    component.cliente = { conta: { id: 10 } };
    component.valorOperacao = 100;
    clienteServiceSpy.depositar.and.returnValue(throwError(() => new Error('Erro servidor')));
    const consoleSpy = spyOn(console, 'error');

    component.confirmarDeposito();

    expect(consoleSpy).toHaveBeenCalledWith("Erro no depósito:", jasmine.any(Error));
  });

  it('deve exibir alerta de erro se a conta de origem não for identificada corretamente', () => {
    component.cliente = null;
    component.confirmarTransferencia();
    expect(alertServiceSpy.errorAlert).toHaveBeenCalledWith('Erro', jasmine.any(String));
  });

  it('deve processar transferência com sucesso e fechar o modal utilizando o seletor CSS', () => {
    component.cliente = { conta: { idConta: 10 } };
    component.contaDestino = '98765';
    component.valorOperacao = 200;
    clienteServiceSpy.transferir.and.returnValue(of({}));

    const divModal = document.createElement('div');
    const botaoFechar = document.createElement('button');
    botaoFechar.classList.add('btn-close');
    divModal.appendChild(botaoFechar);

    const clickSpy = spyOn(botaoFechar, 'click');
    spyOn(document, 'getElementById').and.callFake((id) => id === 'modalTransferir' ? divModal : null);

    component.confirmarTransferencia();

    expect(clienteServiceSpy.transferir).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(alertServiceSpy.successToast).toHaveBeenCalled();
  });

  it('deve gerenciar falhas técnicas e exibir alerta ao usuário em caso de erro no PIX', () => {
    component.cliente = { conta: { idConta: 10 } };
    component.contaDestino = '12345';
    component.valorOperacao = 50;
    clienteServiceSpy.transferir.and.returnValue(throwError(() => new Error('Saldo Insuficiente')));
    const consoleSpy = spyOn(console, 'error');

    component.confirmarTransferencia();

    expect(consoleSpy).toHaveBeenCalled();
    expect(alertServiceSpy.errorAlert).toHaveBeenCalledWith('Falha no PIX', jasmine.any(String));
  });

  it('deve carregar o extrato e agrupar as transações por data corretamente', () => {
    const dataTeste = '2026-02-17T10:00:00';
    const mockTransacoes = [
      { id: 1, valor: 100, dataHora: dataTeste, tipo: 'DEPOSITO' },
      { id: 2, valor: 50, dataHora: dataTeste, tipo: 'SAQUE' }
    ];

    clienteServiceSpy.listarTransacoes.and.returnValue(of(mockTransacoes));
    component.carregarExtrato(10);
    expect(clienteServiceSpy.listarTransacoes).toHaveBeenCalledWith(10);
    expect(component.transacoesAgrupadas).toBeDefined();
    expect(component.transacoesAgrupadas.length).toBeGreaterThan(0);
    const primeiroGrupo = component.transacoesAgrupadas[0];
    expect(primeiroGrupo).toBeDefined();
    if (primeiroGrupo && primeiroGrupo.transacoes) {
      expect(primeiroGrupo.transacoes.length).toBe(2);
    }
  });

  it('deve registrar erro no console quando a busca do extrato falhar', () => {
    const consoleSpy = spyOn(console, 'error');
    clienteServiceSpy.listarTransacoes.and.returnValue(throwError(() => new Error('Erro de conexão')));
    component.carregarExtrato(10);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('deve filtrar as transações por tipo quando um filtro de tipo for selecionado', () => {
    component.transacoesOriginais = [
      { id: 1, tipo: 'DEPOSITO', valor: 100, dataHora: new Date().toISOString() },
      { id: 2, tipo: 'PIX', valor: 50, dataHora: new Date().toISOString() }
    ];
    component.filtroTipo = 'PIX';
    component.aplicarFiltros();
    expect(component.transacoesAgrupadas.length).toBe(1);
  });

  it('deve filtrar transações por um período personalizado de datas', () => {
    component.periodoSelecionado = 'custom';
    component.dataInicio = '2026-02-01';
    component.dataFim = '2026-02-10';
    component.transacoesOriginais = [
      { id: 1, tipo: 'SAQUE', valor: 10, dataHora: '2026-02-05T10:00:00' },
      { id: 2, tipo: 'SAQUE', valor: 20, dataHora: '2026-02-15T10:00:00' }
    ];
    component.aplicarFiltros();

    expect(component.transacoesAgrupadas.length).toBe(1);
    expect(component.transacoesAgrupadas[0].data).toBe('05/02/2026');
  });

  it('deve exibir alerta de erro quando os dados da conta não estiverem carregados corretamente', () => {
    component.cliente = null;

    component.confirmarDeposito();

    expect(alertServiceSpy.errorAlert).toHaveBeenCalledWith(
      'Erro',
      'Dados da conta não carregados. Tente novamente.'
    );
  });

  it('deve exibir alerta de erro quando a conta de origem não for carregada corretamente', () => {
    component.cliente = null;

    component.confirmarTransferencia();

    expect(alertServiceSpy.errorAlert).toHaveBeenCalledWith(
      'Erro',
      'Sua conta não foi carregada corretamente.'
    );
  });

  it('deve exibir alerta de atenção quando a conta de destino ou valor forem inválidos', () => {
    component.cliente = { conta: { idConta: 10 } };
    component.contaDestino = '';
    component.valorOperacao = 0;

    component.confirmarTransferencia();

    expect(alertServiceSpy.errorAlert).toHaveBeenCalledWith(
      'Atenção',
      'Informe a conta de destino e um valor válido.'
    );
  });

  it('deve exibir alerta de atenção quando o valor do saque for zero ou negativo', () => {
    component.valorOperacao = 0;

    component.confirmarSaque();

    expect(alertServiceSpy.errorAlert).toHaveBeenCalledWith(
      'Atenção',
      'Digite um valor válido para o saque.'
    );
  });

  it('deve exibir alerta de erro técnico quando a operação de saque falhar no servidor', () => {
    component.cliente = { conta: { idConta: 10 } };
    component.valorOperacao = 100;
    clienteServiceSpy.sacar.and.returnValue(throwError(() => ({ error: { message: 'Saldo insuficiente' } })));

    component.confirmarSaque();

    expect(alertServiceSpy.errorAlert).toHaveBeenCalledWith(
      'Erro no Saque',
      'Saldo insuficiente'
    );
  });

  it('deve exibir alerta de erro quando não for possível capturar o conteúdo do extrato para exportação', () => {
    spyOn(document, 'getElementById').and.returnValue(null);

    component.exportarHtml();

    expect(alertServiceSpy.errorAlert).toHaveBeenCalledWith(
      'Erro',
      'Não foi possível capturar as movimentações para o arquivo.'
    );
  });

});