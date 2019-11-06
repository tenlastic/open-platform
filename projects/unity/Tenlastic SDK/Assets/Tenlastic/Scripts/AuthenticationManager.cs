using UnityEngine;
using UnityEngine.Events;

namespace Tenlastic {
    public class AuthenticationManager : MonoBehaviour {

        public UnityEvent OnLogin;
        public UnityEvent OnLogout;

        public void LogIn() {
            OnLogin.Invoke();
        }

        public void LogOut() {
            OnLogout.Invoke();
        }

    }
}
