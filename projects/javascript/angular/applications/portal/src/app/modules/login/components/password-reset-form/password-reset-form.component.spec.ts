import { FormBuilder } from '@angular/forms';

import { PasswordResetFormComponent } from './password-reset-form.component';

describe('PasswordResetFormComponent', () => {
    let component: PasswordResetFormComponent;

    beforeEach(() => {
        component = new PasswordResetFormComponent(new FormBuilder());
    });

    describe('ngOnInit()', () => {
        it('initializes the form with default values', () => {
            component.ngOnInit();

            expect(component.form).toBeTruthy();
            expect(component.form.get('password').value).toEqual('');
            expect(component.form.get('confirmPassword').value).toEqual('');
        });
    });

    describe('resetPassword()', () => {
        beforeEach(() => {
            component.ngOnInit();
        });

        describe('when the form is valid', () => {
            it('emits onPasswordReset() with the email address and password', () => {
                const values = {
                    password: 'password',
                    confirmPassword: 'password'
                };
                component.form.setValue(values);

                const onPasswordResetSpy = spyOn(component.passwordReset, 'emit').and.callThrough();
                component.submit();

                expect(onPasswordResetSpy).toHaveBeenCalledWith({ password: values.password });
            });
        });

        describe('when the form is invalid', () => {
            it('has requirement errors', () => {
                component.submit();

                expect(component.form.get('password').hasError('required')).toBeTruthy();
                expect(component.form.get('confirmPassword').hasError('required')).toBeTruthy();
            });

            it('has password confirmation errors', () => {
                const values = {
                    password: 'password',
                    confirmPassword: 'not-password'
                };
                component.form.setValue(values);
                expect(component.form.get('confirmPassword').hasError('required')).toBeTruthy();
            });
        });
    });
});
