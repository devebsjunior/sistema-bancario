import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { ClienteService } from '../../../services/cliente.service';
import { Router } from '@angular/router';
import { AlertService } from '../../../services/alert.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-home-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [CurrencyPipe, DatePipe],
  templateUrl: './home-cliente.component.html',
  styleUrls: ['./home-cliente.component.css']
})
export class HomeClienteComponent implements OnInit, OnDestroy {
  cliente: any = null;
  transacoes: any[] = [];
  currentTime: string = '';
  currentDate: string = '';
  private timer: any;
  countdownText: string = '00:00';
  valorOperacao: number = 0;
  contaDestino: string = '';
  transacoesAgrupadas: any[] = [];
  filtroTipo: string = '';
  filtroData: string = '';
  transacoesOriginais: any[] = []
  periodoSelecionado: string = '3';
  dataInicio: string = '';
  dataFim: string = '';

  constructor(
    private authService: AuthService,
    private clienteService: ClienteService,
    private alertService: AlertService,
    private router: Router
  ) { }

  ngOnInit() {
    this.iniciarTimer();
    const userLogado = this.authService.currentUserValue;
    if (userLogado && userLogado.id) {
      this.clienteService.findById(userLogado.id).subscribe({
        next: (res) => {
          this.cliente = res;
          const idContaReal = res.conta?.idConta || res.conta?.id;

          if (idContaReal) {
            this.carregarExtrato(idContaReal);
          }
        },
        error: (err) => console.error("Erro ao carregar cliente", err)
      });
    }
  }

  iniciarTimer() {
    const token = localStorage.getItem('token');
    let expTime = 0;

    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        expTime = payload.exp * 1000;
      } catch (e) { console.error(e); }
    }

    this.timer = setInterval(() => {
      const agora = new Date();

      this.currentDate = agora.toLocaleDateString('pt-BR', {
        weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
      });

      this.currentTime = agora.toLocaleTimeString('pt-BR');

      if (expTime > 0) {
        const diff = expTime - agora.getTime();
        if (diff <= 0) {
          this.logout();
          return;
        }
        const minutos = Math.floor(diff / 60000);
        const segundos = Math.floor((diff % 60000) / 1000);
        this.countdownText = `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
      }
    }, 1000);
  }

  confirmarDeposito() {
    if (!this.cliente || !this.cliente.conta) {
      this.alertService.errorAlert('Erro', 'Dados da conta não carregados. Tente novamente.');
      return;
    }

    if (this.valorOperacao <= 0) {
      this.alertService.errorAlert('Valor Inválido', 'Digite um valor maior que zero.');
      return;
    }

    const idDaConta = this.cliente.conta.id || this.cliente.conta.idConta;

    this.clienteService.depositar(idDaConta, this.valorOperacao).subscribe({
      next: () => {
        this.alertService.successToast('Depósito realizado!');
        document.getElementById('closeDeposito')?.click();
        this.valorOperacao = 0;
        this.ngOnInit();
      },
      error: (err) => {
        console.error("Erro no depósito:", err);
        this.alertService.errorAlert('Erro', 'Não foi possível depositar.');
      }
    });
  }

  confirmarTransferencia() {
    const idOrigem = this.cliente?.conta?.idConta || this.cliente?.conta?.id;

    if (!idOrigem) {
      this.alertService.errorAlert('Erro', 'Sua conta não foi carregada corretamente.');
      return;
    }

    if (!this.contaDestino || this.valorOperacao <= 0) {
      this.alertService.errorAlert('Atenção', 'Informe a conta de destino e um valor válido.');
      return;
    }

    this.clienteService.transferir(idOrigem, this.contaDestino, this.valorOperacao).subscribe({
      next: () => {
        this.alertService.successToast('Transferência para ' + this.contaDestino + ' realizada!');
        const modalElement = document.getElementById('modalTransferir');
        if (modalElement) {
          const closeBtn = modalElement.querySelector('.btn-close') as HTMLElement;
          closeBtn?.click();
        }

        this.limparCampos();
        this.ngOnInit();
      },
      error: (err) => {
        console.error(err);
        this.alertService.errorAlert('Falha no PIX', 'Verifique o saldo ou se a conta destino existe.');
      }
    });
  }

  limparCampos() {
    this.valorOperacao = 0;
    this.contaDestino = '';
  }

  carregarExtrato(idConta: number) {
    this.clienteService.listarTransacoes(idConta).subscribe({
      next: (res) => {
        this.transacoesOriginais = res;
        this.aplicarFiltros();
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  agruparTransacoes(lista: any[]) {
    const grupos = lista.reduce((acc: any, t: any) => {
      const dataChave = new Date(t.dataHora).toLocaleDateString('pt-BR');

      if (!acc[dataChave]) {
        acc[dataChave] = { data: dataChave, itens: [], subtotal: 0 };
      }

      acc[dataChave].itens.push(t);
      acc[dataChave].subtotal += t.valor;

      return acc;
    }, {});
    this.transacoesAgrupadas = Object.values(grupos);
  }

  confirmarSaque() {
    const idConta = this.cliente?.conta?.idConta || this.cliente?.conta?.id;

    if (this.valorOperacao <= 0) {
      this.alertService.errorAlert('Atenção', 'Digite um valor válido para o saque.');
      return;
    }

    this.clienteService.sacar(idConta, this.valorOperacao).subscribe({
      next: () => {
        this.alertService.successToast('Saque de ' + this.valorOperacao + ' realizado com sucesso!');
        document.getElementById('closeSaque')?.click();

        this.valorOperacao = 0;
        this.ngOnInit();
      },
      error: (err) => {
        this.alertService.errorAlert('Erro no Saque', err.error?.message || 'Saldo insuficiente ou erro no servidor.');
      }
    });
  }

  aplicarFiltros() {
    let lista = [...this.transacoesOriginais];
    if (this.filtroTipo) {
      lista = lista.filter(t => t.tipo.includes(this.filtroTipo));
    }

    const hoje = new Date();
    hoje.setHours(23, 59, 59, 999);
    if (this.periodoSelecionado !== 'custom') {
      const dias = parseInt(this.periodoSelecionado);
      let dataLimite = new Date();
      dataLimite.setDate(hoje.getDate() - dias);
      dataLimite.setHours(0, 0, 0, 0);

      lista = lista.filter(t => {
        const dataT = new Date(t.dataHora);
        return dataT >= dataLimite && dataT <= hoje;
      });
    }
    else if (this.dataInicio && this.dataFim) {
      const inicio = new Date(this.dataInicio + 'T00:00:00');
      const fim = new Date(this.dataFim + 'T23:59:59');

      lista = lista.filter(t => {
        const dataT = new Date(t.dataHora);
        return dataT >= inicio && dataT <= fim;
      });
    }
    this.agruparTransacoes(lista);
  }

  exportarHtml() {
    const agenciaReal = this.cliente?.conta?.agencia?.numero ||
      this.cliente?.agencia?.numero ||
      '1234';

    const numConta = this.cliente?.conta?.numeroConta || '000000';
    const nomeCliente = this.cliente?.nome || 'Cliente';
    const saldoFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
      .format(this.cliente?.conta?.saldo || 0);
    const conteudoExtrato = document.getElementById('secaoExtrato')?.innerHTML;
    if (!conteudoExtrato) {
      this.alertService.errorAlert('Erro', 'Não foi possível capturar as movimentações para o arquivo.');
      return;
    }

    const htmlCompleto = `
    <!DOCTYPE html>
    <html lang="pt-br">
      <head>
        <meta charset="UTF-8">
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <style>
          body { font-family: sans-serif; padding: 40px; color: #333; }
          .text-brand { color: #004a80; font-weight: bold; }
          .header-pdf { border-bottom: 2px solid #004a80; padding-bottom: 15px; margin-bottom: 25px; }
          .bg-light { background-color: #f8f9fa !important; }
          .text-deposit { color: #0d6efd !important; font-weight: bold; }
          .text-transfer-out { color: #fd7e14 !important; font-weight: bold; }
          .text-success { color: #198754 !important; font-weight: bold; }
          .text-danger { color: #dc3545 !important; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header-pdf d-flex justify-content-between align-items-center">
          <div>
            <h1 class="text-brand m-0">BANK TRADE INVEST</h1>
            <p class="m-0 text-muted">Extrato de Movimentações</p>
          </div>
          <div class="text-end">
            <h5 class="m-0">${nomeCliente}</h5>
            <p class="m-0 small">Agência: <strong>${agenciaReal}</strong> | Conta: <strong>${numConta}</strong></p>
          </div>
        </div>
        <div class="row mb-4">
          <div class="col-7">
            <p class="mb-1"><strong>PERÍODO:</strong> ${this.periodoSelecionado === 'custom' ? 'Personalizado' : 'Últimos ' + this.periodoSelecionado + ' dias'}</p>
            <p class="mb-0 text-muted small">Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
          </div>
          <div class="col-5 text-end">
            <div class="p-2 border rounded bg-light">
              <small class="text-muted fw-bold d-block">SALDO DISPONÍVEL</small>
              <h4 class="text-brand m-0">${saldoFormatado}</h4>
            </div>
          </div>
        </div>
        <div class="border rounded overflow-hidden">
          ${conteudoExtrato}
        </div>
      </body>
    </html>
  `;
    const agora = new Date();
    const dataF = agora.toLocaleDateString('pt-BR').replace(/\//g, '-');
    const horaF = agora.getHours().toString().padStart(2, '0') + 'h' + agora.getMinutes().toString().padStart(2, '0');
    const nomeArquivo = `Extrato-${agenciaReal}-${numConta}-${dataF}_${horaF}.html`;
    const blob = new Blob([htmlCompleto], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nomeArquivo;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  ngOnDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

}