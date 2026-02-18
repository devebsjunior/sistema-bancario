import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { UsuarioDTO } from '../../models/auth.model';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  sidebarVisible: boolean = true;
  adminData: UsuarioDTO | null = null;
  currentDate: string = '';
  currentTime: string = '';
  countdownText: string = '00:00'
  private timerRelogio: any;
  private timerSessao: any;

  constructor(private authService: AuthService,
    private router: Router) { }

  ngOnInit() {
    this.adminData = this.authService.currentUserValue;

    if (window.innerWidth < 768) {
      this.sidebarVisible = false;
    }
    this.iniciarRelogio();
    this.startCountdown();
  }

  navigate(path: string) {
    this.router.navigate([`/dashboard/${path}`]);
    if (window.innerWidth < 768) this.sidebarVisible = false;
  }

  iniciarRelogio() {
    this.atualizarDataHora();
    this.timerRelogio = setInterval(() => {
      this.atualizarDataHora();
    }, 1000);
  }

  startCountdown() {
    const token = this.adminData?.token;
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expTimeMillis = payload.exp * 1000;

      this.timerSessao = setInterval(() => {
        const now = Date.now();
        const remainingMillis = expTimeMillis - now;

        if (remainingMillis <= 0) {
          this.countdownText = "00:00";
          clearInterval(this.timerSessao);
          this.logout();
        } else {
          const totalSeconds = Math.floor(remainingMillis / 1000);
          const mins = Math.floor(totalSeconds / 60);
          const secs = totalSeconds % 60;
          this.countdownText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
      }, 1000);
    } catch (e) {
      console.error("Erro ao decodificar validade do token", e);
    }
  }

  private atualizarDataHora() {
    const agora = new Date();
    this.currentDate = agora.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long'
    }).toUpperCase();
    this.currentTime = agora.toLocaleTimeString('pt-BR');
  }

  ngOnDestroy() {
    if (this.timerRelogio) {
      clearInterval(this.timerRelogio);
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}