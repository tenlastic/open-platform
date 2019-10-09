using System.Threading.Tasks;
using TMPro;
using UnityEngine;
using UnityEngine.Events;
using UnityEngine.UI;

namespace Tenlastic {
    public abstract class FormController<TModel> : MonoBehaviour {

        public TextMeshProUGUI errorText;
        public TextMeshProUGUI messageText;
        public TModel record {
            get {
                return _record;
            }
            set {
                _record = value;

                if (value == null) {
                    UnsetRecord();
                } else {
                    SetRecord();
                }
            }
        }
        public Button submitButton;        

        public UnityEventString OnError;
        public UnityEvent OnSuccess;

        private TModel _record;

        protected virtual void Awake() {
            errorText.gameObject.SetActive(false);
            messageText.gameObject.SetActive(false);
            submitButton.enabled = true;
        }

        public abstract void SetRecord();

        public async void Submit() {
            errorText.gameObject.SetActive(false);
            messageText.gameObject.SetActive(false);
            submitButton.enabled = false;

            try {
                if (_record == null) {
                    await CreateRecord();
                } else {
                    await UpdateRecord();
                }
            } catch (ValidationException ex) {
                string error = ex.Message;

                errorText.text = error;
                errorText.gameObject.SetActive(true);
                submitButton.enabled = true;

                OnError.Invoke(error);
                return;
            }

            messageText.text = "Record updated successfully.";
            messageText.gameObject.SetActive(true);
            submitButton.enabled = true;

            OnSuccess.Invoke();
        }

        public abstract void UnsetRecord();

        protected abstract Task CreateRecord();

        protected abstract Task UpdateRecord();

    }
}
