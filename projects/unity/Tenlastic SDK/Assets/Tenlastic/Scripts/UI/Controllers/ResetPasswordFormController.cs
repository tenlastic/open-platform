using Newtonsoft.Json.Linq;
using System.Text.RegularExpressions;
using TMPro;
using UnityEngine;
using UnityEngine.Events;

namespace Tenlastic {
    public class ResetPasswordFormController : MonoBehaviour {

        public PasswordResetService passwordResetService;

        [Header("Fields")]
        public TMP_InputField emailInputField;

        public UnityEventString OnError;
        public UnityEvent OnSuccess;

        public async void Submit() {
            if (string.IsNullOrEmpty(emailInputField.text)) {
                OnError.Invoke("Email address is required.");
                return;
            }

            string regex = @"^[A-Za-z0-9\._%+-]+@[A-Za-z0-9\.-]+\.[A-Za-z]{2,4}$";
            if (!Regex.IsMatch(emailInputField.text, regex)) {
                OnError.Invoke("Email address must be valid.");
                return;
            }

            JObject values = new JObject {
                { "email", emailInputField.text },
            };

            try {
                await passwordResetService.CreateRecord(values);
            } catch {
                OnError.Invoke("Invalid email address.");
                return;
            }

            OnSuccess.Invoke();
        }

    }
}
