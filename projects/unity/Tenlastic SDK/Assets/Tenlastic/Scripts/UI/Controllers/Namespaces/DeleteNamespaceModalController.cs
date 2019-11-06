using UnityEngine;
using UnityEngine.Events;

namespace Tenlastic {
    public class DeleteNamespaceModalController : MonoBehaviour {

        public NamespaceModel namespaceModel { get; set; }
        public NamespaceService namespaceService;

        public UnityEventString OnError;
        public UnityEvent OnSuccess;

        public async void Delete() {
            try {
                await namespaceService.DeleteRecord(namespaceModel._id);
            } catch (HttpException ex) {
                OnError.Invoke(ex.Message);
                return;
            }

            OnSuccess.Invoke();
        }

    }
}
