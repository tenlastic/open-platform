using Newtonsoft.Json.Linq;
using UnityEngine;
using UnityEngine.Events;

namespace Tenlastic {
    public class LoadingNamespaceController : MonoBehaviour {

        public CurrentNamespaceManager currentNamespaceManager;
        public NamespaceService namespaceService;

        public UnityEvent OnSuccess;

        private async void Awake() {
            string _id = currentNamespaceManager._id;
            if (_id == null) {
                OnSuccess.Invoke();
                return;
            }

            NamespaceModel namespaceModel = await namespaceService.FindRecordById(_id);
            if (namespaceModel._id == null) {
                OnSuccess.Invoke();
                return;
            }

            currentNamespaceManager.namespaceModel = namespaceModel;

            OnSuccess.Invoke();
        }

    }
}
