import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ClienteService } from '../../../../services/cliente.service';
import Swal from 'sweetalert2';
import { AgenciaService } from '../../../../services/agencia.service';
import { CepService } from '../../../../services/cep.service';

@Component({
  selector: 'app-cadastrar-cliente',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cadastrar-cliente.component.html',
  styleUrls: ['./cadastrar-cliente.component.css']
})
export class CadastrarClienteComponent implements OnInit {
  clienteForm!: FormGroup;
  agencias: any[] = [];

  constructor(
    private fb: FormBuilder,
    private clienteService: ClienteService,
    private agenciaService: AgenciaService,
    private cepService: CepService,
    private router: Router
  ) { }

  ngOnInit() {
    this.clienteForm = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(10)]],
      cpf: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, Validators.minLength(6)]],
      profile: ['CLIENTE'],

      conta: this.fb.group({
        numeroConta: ['', Validators.required],
        saldo: [0],
        agencia: this.fb.group({
          id: ['', Validators.required]
        })
      }),

      enderecoCliente: this.fb.group({
        logradouro: ['', Validators.required],
        numero: ['', Validators.required],
        complemento: [''],
        bairro: ['', Validators.required],
        cidade: ['', Validators.required],
        estado: ['', Validators.required],
        cep: ['', Validators.required]
      })
    });

    this.listarAgencias();
  }

  formatarCpf(event: any) {
    let v = event.target.value.replace(/\D/g, '');
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');

    event.target.value = v;

    const control = this.clienteForm.get('cpf');
    if (control) {
      control.setValue(v);
      if (v.length === 14) {
        control.markAsTouched();
        control.updateValueAndValidity();
      }
    }
  }

  consultarCep() {
    const cepControl = this.clienteForm.get('enderecoCliente.cep');
    const cep = cepControl?.value?.replace(/\D/g, '');

    if (cep && cep.length === 8) {
      this.cepService.buscar(cep).subscribe({
        next: (dados) => {
          if (!dados.erro) {
            this.clienteForm.get('enderecoCliente')?.patchValue({
              logradouro: dados.logradouro,
              bairro: dados.bairro,
              cidade: dados.localidade,
              estado: dados.uf
            });
            document.getElementById('numero')?.focus();
          } else {
            Swal.fire('CEP não encontrado', 'Verifique o número digitado.', 'warning');
          }
        },
        error: () => console.error('Erro na busca do CEP')
      });
    }
  }

  listarAgencias() {
    this.agenciaService.findAll().subscribe({
      next: (dados) => {
        this.agencias = dados;
      },
      error: () => console.error('Erro ao carregar agências')
    });
  }

  salvar() {
    if (this.clienteForm.valid) {
      const formValue = this.clienteForm.value;

      const dadosParaEnviar = {
        nome: formValue.nome,
        cpf: formValue.cpf.replace(/\D/g, ''),
        email: formValue.email,
        senha: formValue.senha,
        profile: "CLIENTE",
        enderecoCliente: {
          logradouro: formValue.enderecoCliente.logradouro,
          numero: formValue.enderecoCliente.numero,
          complemento: formValue.enderecoCliente.complemento,
          bairro: formValue.enderecoCliente.bairro,
          cidade: formValue.enderecoCliente.cidade,
          estado: formValue.enderecoCliente.estado,
          cep: formValue.enderecoCliente.cep
        },
        conta: {
          numeroConta: formValue.conta.numeroConta,
          saldo: 0,
          agencia: {
            id: Number(formValue.conta.agencia.id)
          }
        }
      };

      this.clienteService.cadastrar(dadosParaEnviar).subscribe({
        next: () => {
          Swal.fire('Sucesso!', 'Cliente cadastrado.', 'success');
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          console.error('Detalhe do erro:', err);
          const mensagemErro = JSON.stringify(err);

          if (mensagemErro.includes('Duplicate entry')) {
            Swal.fire('CPF Duplicado', 'Este CPF já está cadastrado no sistema.', 'warning');
          } else if (err.status === 201 || err.status === 200) {
            Swal.fire('Sucesso!', 'Cliente cadastrado (ajuste o loop no Java para evitar este aviso).', 'success');
            this.router.navigate(['/dashboard']);
          } else {
            Swal.fire('Erro no Cadastro', 'Verifique os dados ou o console do Java.', 'error');
          }
        }
      });
    }
  }

  cancelar() {
    this.router.navigate(['/dashboard']);
  }
}