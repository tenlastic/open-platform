import { FormBuilder } from '@angular/forms';

import { LoginFormComponent } from './login-form.component';

describe('LoginFormComponent', () => {
    let component: LoginFormComponent;

    beforeEach(() => {
        component = new LoginFormComponent(new FormBuilder());
    });

    describe('ngOnInit()', () => {
        it('initializes the form with default values', () => {
            component.ngOnInit();

            expect(component.form).toBeTruthy();
            expect(component.form.get('email').value).toEqual('');
            expect(component.form.get('password').value).toEqual('');
        });
    });

    describe('logIn()', () => {
        beforeEach(() => {
            component.ngOnInit();
        });

        describe('when the form is valid', () => {
            it('emits onLogIn() with the email address and password', () => {
                const values = {
                    email: 'test@example.com',
                    password: 'password'
                };
                component.form.setValue(values);

                const onLogInSpy = spyOn(component.logIn, 'emit').and.callThrough();
                component.submit();

                expect(onLogInSpy).toHaveBeenCalledWith({
                    email: values.email,
                    password: values.password
                });
            });
        });

        describe('when the form is invalid', () => {
            it('has validation errors', () => {
                component.submit();

                expect(component.form.get('email').hasError('required')).toBeTruthy();
                expect(component.form.get('password').hasError('required')).toBeTruthy();
            });
        });
    });
});
