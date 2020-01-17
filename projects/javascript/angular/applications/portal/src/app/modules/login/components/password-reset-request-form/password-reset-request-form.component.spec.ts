import { FormBuilder } from '@angular/forms';

import { PasswordResetRequestFormComponent } from './password-reset-request-form.component';

describe('PasswordResetRequestForm', () => {
    let component: PasswordResetRequestFormComponent;

    beforeEach(() => {
        component = new PasswordResetRequestFormComponent(new FormBuilder());
    });

    describe('ngOnInit()', () => {
        it('initializes the form with default values', () => {
            component.ngOnInit();

            expect(component.form).toBeTruthy();
            expect(component.form.get('email').value).toEqual('');
        });
    });

    describe('resetPassword()', () => {
        beforeEach(() => {
            component.ngOnInit();
        });

        describe('when the form is valid', () => {
            it('emits onPasswordResetRequested() with the email address', () => {
                const values = {
                    email: 'test@example.com'
                };
                component.form.setValue(values);

                const onPasswordResetRequestedSpy = spyOn(component.passwordResetRequested, 'emit').and.callThrough();
                component.submit();

                expect(onPasswordResetRequestedSpy).toHaveBeenCalledWith({ email: values.email });
            });
        });

        describe('when the form is invalid', () => {
            it('has validation errors', () => {
                component.submit();

                expect(component.form.get('email').hasError('required')).toBeTruthy();
            });
        });
    });
});
