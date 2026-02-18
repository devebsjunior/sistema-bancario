import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertService } from '../../services/alert.service';

import { LoginRequest, UsuarioDTO } from '../../models/auth.model';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  loginForm: LoginRequest = {
    email: '',
    password: ''
  };

  constructor(
    private authService: AuthService,
    private alertService: AlertService,
    private router: Router
  ) { }

  onLogin() {
    this.authService.login(this.loginForm).subscribe({
      next: (user: UsuarioDTO) => {
        this.alertService.successToast(`Bem-vindo, ${user.name}!`);
        setTimeout(() => {
          if (user.perfil === 'ADMIN') {
            this.router.navigate(['/dashboard/perfil']);
          } else {
            this.router.navigate(['/home-cliente']);
          }
        }, 1200);
      },
      error: (err) => {
        this.alertService.errorAlert('Falha no Acesso', 'Verifique suas credenciais.');
      }
    });
  }
}