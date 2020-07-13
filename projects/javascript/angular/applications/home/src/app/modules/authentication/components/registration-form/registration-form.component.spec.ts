import { RegistrationFormComponent } from './registration-form.component';

describe('RegistrationFormComponent', () => {
  let component: RegistrationFormComponent;

  beforeEach(() => {
    component = new RegistrationFormComponent();
  });

  describe('ngOnInit()', () => {
    it('initializes the form with default values', () => {
      component.ngOnInit();

      expect(component.form).toBeTruthy();
      expect(component.form.get('email').value).toEqual('');
      expect(component.form.get('passwords').get('password').value).toEqual('');
      expect(component.form.get('passwords').get('confirmPassword').value).toEqual('');
      expect(component.form.get('username').value).toEqual('');
    });
  });

  describe('register()', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    describe('when the form is valid', () => {
      it('emits onRegister() with the email address and password', () => {
        const values = {
          email: 'test@example.com',
          passwords: {
            password: 'password',
            confirmPassword: 'password',
          },
          username: 'username',
        };
        component.form.setValue(values);

        const onRegisterSpy = spyOn(component.register, 'emit').and.callThrough();
        component.submit();

        expect(onRegisterSpy).toHaveBeenCalledWith({
          email: values.email,
          password: values.passwords.password,
          username: values.username,
        });
      });
    });

    describe('when the form is invalid', () => {
      it('has requirement errors', () => {
        component.submit();

        expect(component.form.get('email').hasError('required')).toBeFalsy();
        expect(
          component.form
            .get('passwords')
            .get('password')
            .hasError('required'),
        ).toBeTruthy();
        expect(
          component.form
            .get('passwords')
            .get('confirmPassword')
            .hasError('required'),
        ).toBeTruthy();
        expect(component.form.get('username').hasError('required')).toBeTruthy();
      });

      it('has password confirmation errors', () => {
        const values = {
          email: 'test@example.com',
          passwords: {
            password: 'password',
            confirmPassword: 'not-password',
          },
          username: 'username',
        };
        component.form.setValue(values);

        expect(
          component.form
            .get('passwords')
            .get('confirmPassword')
            .hasError('required'),
        ).toBeTruthy();
      });
    });
  });
});
