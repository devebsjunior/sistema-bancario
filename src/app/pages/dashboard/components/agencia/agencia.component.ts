import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { AgenciaService } from '../../../../services/agencia.service';
import { CepService } from '../../../../services/cep.service';

@Component({
  selector: 'app-agencia',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './agencia.component.html',
  styleUrl: './agencia.component.css'
})
export class AgenciaComponent {

  agenciaForm!: FormGroup;
  agencias: any[] = [];

  constructor(
    private fb: FormBuilder,
    private agenciaService: AgenciaService,
    private cepService: CepService
  ) { }

  ngOnInit() {
    this.agenciaForm = this.fb.group({
      nome: ['', Validators.required],
      numeroAgencia: ['', Validators.required],
      logradouro: ['', Validators.required],
      numero: ['', Validators.required],
      bairro: ['', Validators.required],
      cidade: ['', Validators.required],
      estado: ['', [Validators.required, Validators.maxLength(2)]],
      cep: ['', Validators.required]
    });
    this.carregarAgencias();
  }

  buscarCep() {
    const cep = this.agenciaForm.get('cep')?.value;
    if (cep?.length >= 8) {
      this.cepService.buscar(cep).subscribe(dados => {
        if (!dados.erro) {
          this.agenciaForm.patchValue({
            logradouro: dados.logradouro,
            bairro: dados.bairro,
            cidade: dados.localidade,
            estado: dados.uf
          });
        }
      });
    }
  }

  carregarAgencias() {
    this.agenciaService.findAll().subscribe(dados => this.agencias = dados);
  }

  salvar() {
    if (this.agenciaForm.valid) {
      const formValue = this.agenciaForm.value;

      const dadosParaEnviar = {
        nome: formValue.nome,
        numeroAgencia: formValue.numeroAgencia,
        enderecoAgencia: {
          logradouro: formValue.logradouro,
          numero: formValue.numero,
          bairro: formValue.bairro,
          cidade: formValue.cidade,
          estado: formValue.estado,
          cep: formValue.cep
        }
      };

      this.agenciaService.cadastrar(dadosParaEnviar).subscribe({
        next: () => {
          Swal.fire('Sucesso', 'Agência e Endereço cadastrados!', 'success');
          this.agenciaForm.reset();
          this.carregarAgencias();
        },
        error: (err) => {
          console.error(err);
          Swal.fire('Erro', 'Não foi possível salvar a agência.', 'error');
        }
      });
    }
  }

  limparFormulario() {
    this.agenciaForm.reset();
  }

}
