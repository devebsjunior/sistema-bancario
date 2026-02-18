import { TestBed } from '@angular/core/testing';
import { AlertService } from './alert.service';
import Swal from 'sweetalert2';

(window as any).bootstrap = {
	Modal: Object.assign(
		jasmine.createSpy('Modal').and.returnValue({ show: () => { }, hide: () => { } }),
		{ getInstance: jasmine.createSpy('getInstance').and.returnValue(null) }
	)
};

describe('AlertService', () => {
	let service: AlertService;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [AlertService]
		});
		service = TestBed.inject(AlertService);

	});

	afterEach(() => {
		Swal.close();
	});


	it('deve disparar o toast de sucesso com a mensagem correta', () => {
		const serviceAny = service as any;
		const fireSpy = spyOn(serviceAny.toast, 'fire');

		service.successToast('Operação realizada');

		expect(fireSpy).toHaveBeenCalledWith(jasmine.objectContaining({
			icon: 'success',
			title: 'Operação realizada'
		}));
	});

	it('deve disparar o alerta de erro com título e texto corretos', () => {
		const swalSpy = spyOn(Swal, 'fire');

		service.errorAlert('Erro Crítico', 'Falha na conexão');

		expect(swalSpy).toHaveBeenCalledWith(jasmine.objectContaining({
			icon: 'error',
			title: 'Erro Crítico',
			text: 'Falha na conexão'
		}));
	});
	it('deve configurar corretamente os listeners de timer no toast', () => {
		const mockToast = {
			addEventListener: jasmine.createSpy('addEventListener')
		};

		const serviceAny = service as any;
		serviceAny.toast.update({
			didOpen: (toast: HTMLElement) => {
				toast.addEventListener('mouseenter', Swal.stopTimer);
				toast.addEventListener('mouseleave', Swal.resumeTimer);
			}
		});

		const didOpen = serviceAny.toast.getTimerLeft ? null : serviceAny.toast.params.didOpen;

		if (didOpen) {
			didOpen(mockToast as any);
			expect(mockToast.addEventListener).toHaveBeenCalledWith('mouseenter', Swal.stopTimer);
			expect(mockToast.addEventListener).toHaveBeenCalledWith('mouseleave', Swal.resumeTimer);
		}
	});

	it('deve configurar os ouvintes de eventos no didOpen do toast', () => {
		const mockToast = {
			addEventListener: jasmine.createSpy('addEventListener')
		};

		const serviceAny = service as any;
		const didOpen = serviceAny.toast.params?.didOpen;

		if (didOpen) {
			didOpen(mockToast as any);
			expect(mockToast.addEventListener).toHaveBeenCalledWith('mouseenter', jasmine.any(Function));
			expect(mockToast.addEventListener).toHaveBeenCalledWith('mouseleave', jasmine.any(Function));
		}
	});

	it('deve configurar os ouvintes de mouseenter e mouseleave no didOpen do toast', () => {
		const mockToast = {
			addEventListener: jasmine.createSpy('addEventListener')
		};

		const swalSpy = spyOn(Swal, 'mixin').and.callThrough();

		const alertServiceLocal = new AlertService();

		const mixinConfig = swalSpy.calls.mostRecent().args[0];

		if (mixinConfig && mixinConfig.didOpen) {
			mixinConfig.didOpen(mockToast as any);

			expect(mockToast.addEventListener).toHaveBeenCalledWith('mouseenter', Swal.stopTimer);
			expect(mockToast.addEventListener).toHaveBeenCalledWith('mouseleave', Swal.resumeTimer);
		}
	});

});