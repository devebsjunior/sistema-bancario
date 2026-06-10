import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ClienteService } from '../../../../services/cliente.service';
import { ClienteDTO } from '../../../../models/cliente.model';
import Swal from 'sweetalert2';
import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas'

declare var bootstrap: any;

@Component({
  selector: 'app-listar-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './listar-cliente.component.html',
  styleUrls: ['./listar-cliente.component.css']
})
export class ListarClienteComponent implements OnInit {
  clientes: any[] = [];
  clienteSelecionado: any = null;
  transacoesOriginais: any[] = [];
  transacoesAgrupadas: any[] = [];
  periodoSelecionado: string = '3';
  dataInicio: string = '';
  dataFim: string = '';
  filtroTipo: string = '';
  private modalInstancia: any;

  constructor(
    private clienteService: ClienteService,
    private router: Router
  ) { }

  ngOnInit() {
    this.carregarClientes();
  }

  carregarClientes() {
    this.clienteService.findAll().subscribe({
      next: (dados: ClienteDTO[]) => {
        this.clientes = dados;
        console.log("LISTAR-CLIENTES] : ", this.clientes)
      },
      error: (err) => {
        console.error(err);
        Swal.fire('Erro', 'Não foi possível carregar os clientes.', 'error');
      }
    });
  }

  novoCliente() {
    this.router.navigate(['/dashboard/cadastrar-cliente']);
  }
  
  abrirExtrato(cliente: any) {
    this.clienteSelecionado = cliente;
    const idConta = cliente.conta?.idConta || cliente.conta?.id;

    if (idConta) {
      this.clienteService.listarTransacoes(idConta).subscribe({
        next: (res) => {
          this.transacoesOriginais = res;
          this.aplicarFiltros();
          this.exibirModal();
        },
        error: () => Swal.fire('Erro', 'Falha ao buscar as transações.', 'error')
      });
    }
  }

  private exibirModal() {
    const modalElement = document.getElementById('modalExtrato');
    if (modalElement) {
      this.modalInstancia = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
      this.modalInstancia.show();
    }
  }

  exportarPDF() {
    const elemento = document.getElementById('secaoExtratoAdmin');
    const c: any = this.clienteSelecionado;
    if (!elemento || !c) return;

    const hoje = new Date();
    let textoPeriodo: string = '';
    const pSel = this.periodoSelecionado || '3';
    const dIni = this.dataInicio || '';
    const dFim = this.dataFim || '';

    if (pSel === 'custom' && dIni && dFim) {
      const dataIni = new Date(dIni + 'T00:00:00').toLocaleDateString('pt-BR');
      const dataFim = new Date(dFim + 'T00:00:00').toLocaleDateString('pt-BR');
      textoPeriodo = `Período: ${dataIni} até ${dataFim}`;
    } else {
      const dias = parseInt(pSel);
      const dataPassado = new Date();
      dataPassado.setDate(hoje.getDate() - dias);
      textoPeriodo = `Período: ${dataPassado.toLocaleDateString('pt-BR')} até ${hoje.toLocaleDateString('pt-BR')} (Últimos ${dias} dias)`;
    }

    Swal.fire({ title: 'Gerando Extrato...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });

    html2canvas(elemento, { scale: 2 }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      pdf.setFontSize(22);
      pdf.setTextColor(1, 74, 128);
      pdf.text('BANK TRADE INVEST', 15, 20);
      pdf.setFontSize(10);
      pdf.setTextColor(100);
      pdf.text('Extrato de Movimentações - ADMIN', 15, 26);
      pdf.setTextColor(0);
      pdf.setFontSize(11);
      pdf.text(String(c.nome || '').toUpperCase(), pdfWidth - 15, 20, { align: 'right' });
      pdf.setFontSize(9);
      const agCC = `Agência: ${c.conta?.agencia?.numeroAgencia || '0000'} | Conta: ${c.conta?.numeroConta || '000000'}`;
      pdf.text(agCC, pdfWidth - 15, 26, { align: 'right' });
      pdf.setDrawColor(200);
      pdf.line(15, 32, pdfWidth - 15, 32);
      pdf.setFont('helvetica', 'bold'); 
      pdf.text(textoPeriodo.toUpperCase(), 15, 38);
      pdf.setFont('helvetica', 'normal'); 
      pdf.text(`Gerado em: ${hoje.toLocaleString('pt-BR')}`, 15, 43);

      const saldoVal = c.conta?.saldo || 0;
      pdf.setFillColor(248, 249, 250);
      pdf.roundedRect(pdfWidth - 75, 35, 60, 15, 2, 2, 'F');
      pdf.setFontSize(8);
      pdf.text('SALDO DISPONÍVEL', pdfWidth - 20, 40, { align: 'right' });
      pdf.setFontSize(14);
      pdf.setTextColor(1, 74, 128);
      const saldoF = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(saldoVal);
      pdf.text(saldoF, pdfWidth - 20, 47, { align: 'right' });

      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * (pdfWidth - 30)) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 15, 55, pdfWidth - 30, imgHeight);

      const cpfLimpo = String(c.cpf || '').replace(/\D/g, '');
      const dataF = hoje.toLocaleDateString('pt-BR').replace(/\//g, '');
      const horaF = hoje.getHours().toString().padStart(2, '0') + hoje.getMinutes().toString().padStart(2, '0');
      const nomeArquivo = `${cpfLimpo}-${c.conta?.agencia?.numeroAgencia}-${c.conta?.numeroConta}-${dataF}-${horaF}.pdf`;

      pdf.save(nomeArquivo);
      Swal.close();
    }).catch(err => {
      console.error(err);
      Swal.fire('Erro', 'Falha ao gerar o documento.', 'error');
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
    } else if (this.dataInicio && this.dataFim) {
      const inicio = new Date(this.dataInicio + 'T00:00:00');
      const fim = new Date(this.dataFim + 'T23:59:59');

      lista = lista.filter(t => {
        const dataT = new Date(t.dataHora);
        return dataT >= inicio && dataT <= fim;
      });
    }
    this.agruparTransacoes(lista);
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

}