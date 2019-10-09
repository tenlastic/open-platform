using Newtonsoft.Json.Linq;
using TMPro;
using UnityEngine;
using UnityEngine.Events;

namespace Tenlastic {
    public class CreateAccountFormController : MonoBehaviour {

        public LoginService loginService;
        public UserService userService;        

        [Header("Fields")]
        public TMP_InputField emailInputField;
        public TMP_InputField passwordInputField;
        public TMP_InputField passwordConfirmationInputField;
        public TMP_InputField usernameInputField;

        public UnityEventString OnError;
        public UnityEvent OnSuccess;

        public async void Submit() {
            if (string.IsNullOrEmpty(passwordInputField.text)) {
                OnError.Invoke("Password is required.");
                return;
            }

            if (passwordInputField.text != passwordConfirmationInputField.text) {
                OnError.Invoke("Passwords do not match.");
                return;
            }

            JObject values = new JObject {
                { "email", emailInputField.text },
                { "password", passwordInputField.text },
                { "username", usernameInputField.text }
            };

            try {
                await userService.CreateRecord(values);
            } catch (ValidationException ex) {
                OnError.Invoke(ex.Message);
                return;
            }

            try {
                await loginService.CreateWithCredentials(emailInputField.text, passwordInputField.text);
            } catch (HttpException) {
                OnError.Invoke("User created successfully, but login failed. Please try logging in again.");
                return;
            }

            OnSuccess.Invoke();
        }

    }
}
