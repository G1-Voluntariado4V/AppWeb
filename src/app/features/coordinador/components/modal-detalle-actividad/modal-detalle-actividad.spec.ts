import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalDetalleActividad } from './modal-detalle-actividad';

describe('ModalDetalleActividad', () => {
  let component: ModalDetalleActividad;
  let fixture: ComponentFixture<ModalDetalleActividad>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalDetalleActividad]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalDetalleActividad);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
