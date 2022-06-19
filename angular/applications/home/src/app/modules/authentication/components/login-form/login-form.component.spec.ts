import { LoginFormComponent } from './login-form.component';

describe('LoginFormComponent', () => {
  let component: LoginFormComponent;

  beforeEach(() => {
    component = new LoginFormComponent();
  });

  describe('ngOnInit()', () => {
    it('initializes the form with default values', () => {
      component.ngOnInit();

      expect(component.form).toBeTruthy();
      expect(component.form.get('password').value).toEqual('');
      expect(component.form.get('username').value).toEqual('');
    });
  });

  describe('logIn()', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    describe('when the form is valid', () => {
      it('emits onLogIn() with the username and password', () => {
        const values = {
          password: 'password',
          username: 'test',
        };
        component.form.setValue(values);

        const onLogInSpy = spyOn(component.logIn, 'emit').and.callThrough();
        component.submit();

        expect(onLogInSpy).toHaveBeenCalledWith({
          password: values.password,
          username: values.username,
        });
      });
    });

    describe('when the form is invalid', () => {
      it('has validation errors', () => {
        component.submit();

        expect(component.form.get('password').hasError('required')).toBeTruthy();
        expect(component.form.get('username').hasError('required')).toBeTruthy();
      });
    });
  });
});
