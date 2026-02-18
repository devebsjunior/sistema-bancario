import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AgenciaComponent } from './agencia.component';
import { ReactiveFormsModule } from '@angular/forms';
import { AgenciaService } from '../../../../services/agencia.service';
import { CepService } from '../../../../services/cep.service';
import { of, throwError } from 'rxjs';
import Swal from 'sweetalert2';

describe('AgenciaComponent', () => {
  let component: AgenciaComponent;
  let fixture: ComponentFixture<AgenciaComponent>;

  let agenciaServiceSpy: jasmine.SpyObj<AgenciaService>;
  let cepServiceSpy: jasmine.SpyObj<CepService>;

  beforeEach(async () => {
    agenciaServiceSpy = jasmine.createSpyObj('AgenciaService', ['cadastrar', 'findAll']);
    cepServiceSpy = jasmine.createSpyObj('CepService', ['buscar']);

    agenciaServiceSpy.findAll.and.returnValue(of([{ id: 1, nome: 'Agência Serrinha' }]));

    await TestBed.configureTestingModule({
      imports: [AgenciaComponent, ReactiveFormsModule],
      providers: [
        { provide: AgenciaService, useValue: agenciaServiceSpy },
        { provide: CepService, useValue: cepServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AgenciaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('deve criar o componente e carregar agências no início', () => {
    expect(component).toBeTruthy();
    expect(agenciaServiceSpy.findAll).toHaveBeenCalled();
    expect(component.agencias.length).toBe(1);
  });

  it('deve preencher o endereço automaticamente ao buscar um CEP válido', () => {
    const mockCep = {
      logradouro: 'Avenida Principal',
      bairro: 'Centro',
      localidade: 'Resende',
      uf: 'RJ',
      erro: false
    };
    cepServiceSpy.buscar.and.returnValue(of(mockCep));

    component.agenciaForm.get('cep')?.setValue('27500000');
    component.buscarCep();

    expect(component.agenciaForm.get('logradouro')?.value).toBe('Avenida Principal');
    expect(component.agenciaForm.get('cidade')?.value).toBe('Resende');
  });

  it('deve limpar o formulário ao chamar limparFormulario', () => {
    component.agenciaForm.get('nome')?.setValue('Agência Teste');
    component.limparFormulario();
    expect(component.agenciaForm.get('nome')?.value).toBeNull();
  });

  it('deve enviar os dados formatados corretamente ao salvar', () => {
    const dadosForm = {
      nome: 'Agência Belem Central',
      numeroAgencia: '1010',
      logradouro: 'Rua das Flores',
      numero: '100',
      bairro: 'Jardim',
      cidade: 'Penedo',
      estado: 'RJ',
      cep: '27580000'
    };

    component.agenciaForm.setValue(dadosForm);
    agenciaServiceSpy.cadastrar.and.returnValue(of({}));
    const swalSpy = spyOn(Swal, 'fire');

    component.salvar();

    expect(agenciaServiceSpy.cadastrar).toHaveBeenCalledWith(jasmine.objectContaining({
      nome: 'Agência Belem Central',
      enderecoAgencia: jasmine.objectContaining({
        logradouro: 'Rua das Flores',
        cidade: 'Penedo'
      })
    }));
    expect(swalSpy).toHaveBeenCalledWith('Sucesso', jasmine.any(String), 'success');
  });

  it('deve mostrar erro no Swal se o cadastro falhar', () => {
    component.agenciaForm.patchValue({ nome: 'Erro', numeroAgencia: '000' });
    spyOnProperty(component.agenciaForm, 'valid', 'get').and.returnValue(true);
    
    agenciaServiceSpy.cadastrar.and.returnValue(throwError(() => new Error('Erro servidor')));
    const swalSpy = spyOn(Swal, 'fire');

    component.salvar();

    expect(swalSpy).toHaveBeenCalledWith('Erro', jasmine.any(String), 'error');
  });
});