using UnityEngine;
using UnityEngine.Events;

namespace Tenlastic {
    public class LogoutController : MonoBehaviour {

        public AuthenticationManager authenticationManager;
        public LoginService loginService;

        public UnityEvent OnSuccess;

        public async void LogOut() {
            await loginService.LogOut();

            OnSuccess.Invoke();
        }

    }
}
