using TMPro;
using UnityEngine;
using UnityEngine.Events;

namespace Tenlastic {
    public class LogInFormController : MonoBehaviour {

        public CurrentUserManager currentUserManager;
        public LoginService loginService;
        public TokenManager tokenManager;

        [Header("Fields")]
        public TMP_InputField emailInputField;
        public TMP_InputField passwordInputField;

        public UnityEventString OnError;
        public UnityEvent OnSuccess;

        private void Awake() {
            if (string.IsNullOrEmpty(tokenManager.refreshToken)) {
                return;
            }

            Jwt refreshToken = new Jwt(tokenManager.refreshToken);
            if (refreshToken.isExpired) {
                return;
            }

            Jwt accessToken = new Jwt(tokenManager.accessToken);
            currentUserManager.userModel = accessToken.payload.user;

            OnSuccess.Invoke();
        }

        public async void Submit() {
            if (string.IsNullOrEmpty(emailInputField.text)) {
                OnError.Invoke("Email address is required.");
                return;
            }

            if (string.IsNullOrEmpty(passwordInputField.text)) {
                OnError.Invoke("Password is required.");
                return;
            }

            try {
                await loginService.CreateWithCredentials(emailInputField.text, passwordInputField.text);
            } catch {
                OnError.Invoke("Invalid email address or password.");
                return;
            }

            OnSuccess.Invoke();
        }

    }
}
