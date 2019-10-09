using Newtonsoft.Json.Linq;
using TMPro;
using UnityEngine;
using UnityEngine.Events;

namespace Tenlastic {
    public class ManageAccountFormController : MonoBehaviour {

        public CurrentUserManager currentUserManager;
        public UserService userService;

        [Header("Fields")]
        public TMP_InputField emailInputField;
        public TMP_InputField usernameInputField;

        public UnityEventString OnError;
        public UnityEvent OnSuccess;

        private void OnEnable() {
            emailInputField.text = currentUserManager.userModel.email;
            usernameInputField.text = currentUserManager.userModel.username;
        }

        public async void Submit() {
            JObject values = new JObject {
                { "_id", currentUserManager.userModel._id },
                { "email", emailInputField.text },
                { "username", usernameInputField.text }
            };

            try {
                UserModel userModel = await userService.UpdateRecord(values);
                currentUserManager.userModel = userModel;
            } catch (ValidationException ex) {
                OnError.Invoke(ex.Message);
                return;
            }

            OnSuccess.Invoke();
        }

    }
}

