import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { CadastrarClienteComponent } from './pages/dashboard/components/cadastrar-cliente/cadastrar-cliente.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ListarClienteComponent } from './pages/dashboard/components/listar-cliente/listar-cliente.component';
import { AgenciaComponent } from './pages/dashboard/components/agencia/agencia.component';

export const routes: Routes = [
{ path: 'login', component: LoginComponent },
  { 
    path: 'dashboard',  component: DashboardComponent,
    children: [
      { path: 'listar-clientes', component: ListarClienteComponent },
      { path: 'agencia', component: AgenciaComponent },
      { path: 'cadastrar-cliente', component: CadastrarClienteComponent },
      { path: 'perfil', loadComponent: () => import('./pages/dashboard/components/perfil/perfil.component').then(m => m.PerfilComponent) },
      { path: '', redirectTo: 'listar-clientes', pathMatch: 'full' }
    ]
  },
  { 
    path: 'home-cliente', 
    loadComponent: () => import('./pages/area-cliente/home-cliente/home-cliente.component').then(m => m.HomeClienteComponent) 
  },

  { path: '', redirectTo: 'login', pathMatch: 'full' }
];
