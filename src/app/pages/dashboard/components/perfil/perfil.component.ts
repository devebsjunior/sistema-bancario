import { Component, OnInit } from '@angular/core';
import { AgenciaService } from '../../../../services/agencia.service';
import { ClienteService } from '../../../../services/cliente.service';
import { CommonModule, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.css']
})
export class PerfilComponent implements OnInit {

  totalClientes: number = 0;
  totalAgencias: number = 0;

  constructor(
    private clienteService: ClienteService,
    private agenciaService: AgenciaService
  ) { }

  ngOnInit() {
    this.carregarMetricas();
  }

  carregarMetricas() {
    this.clienteService.findAll().subscribe({
      next: (dados) => this.totalClientes = dados.length,
      error: (err) => console.error("Erro ao carregar clientes", err)
    });
    
    this.agenciaService.findAll().subscribe({
      next: (dados) => this.totalAgencias = dados.length,
      error: (err) => console.error("Erro ao carregar agências", err)
    });
  }
}