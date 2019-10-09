using UnityEngine;
using UnityEngine.Events;

namespace Tenlastic {
    public class CurrentNamespaceManager : MonoBehaviour {

        public NamespaceModel namespaceModel {
            get {
                return _namespaceModel;
            }
            set {
                _namespaceModel = value;

                if (value == null) {
                    OnNamespaceModelUnset.Invoke();
                } else {
                    OnIdSet.Invoke(value._id);
                    OnNameSet.Invoke(value.name);

                    OnNamespaceModelSet.Invoke(value);
                }
            }
        }

        public UnityEventString OnIdSet;
        public UnityEventString OnNameSet;
        public UnityEventNamespaceModel OnNamespaceModelSet;
        public UnityEvent OnNamespaceModelUnset;

        private NamespaceModel _namespaceModel;

        private void Awake() {
            NamespaceService.OnDeleteRecord += NamespaceService_OnDeleteRecord;
            NamespaceService.OnUpdateRecord += NamespaceService_OnUpdateRecord;
        }

        private void OnDestroy() {
            NamespaceService.OnDeleteRecord -= NamespaceService_OnDeleteRecord;
            NamespaceService.OnUpdateRecord -= NamespaceService_OnUpdateRecord;
        }

        public void Clear() {
            namespaceModel = null;
        }

        private void NamespaceService_OnDeleteRecord(string _id) {
            if (namespaceModel == null) {
                return;
            }

            if (_id == namespaceModel._id) {
                namespaceModel = null;
            }
        }

        private void NamespaceService_OnUpdateRecord(NamespaceModel namespaceModel) {
            if (this.namespaceModel == null) {
                return;
            }

            if (namespaceModel._id == this.namespaceModel._id) {
                this.namespaceModel = namespaceModel;
            }
        }

    }
}
