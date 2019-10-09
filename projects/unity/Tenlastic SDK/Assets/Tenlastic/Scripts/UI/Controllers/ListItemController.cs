using TMPro;
using UnityEngine;
using UnityEngine.Events;

namespace Tenlastic {
    public abstract class ListItemController<TModel, TUnityEvent> : MonoBehaviour where TUnityEvent : UnityEvent<TModel> {

        public TModel record {
            get {
                return _record;
            }
            set {
                _record = value;

                SetRecord(value);
            }
        }

        public TUnityEvent OnDelete;
        public TUnityEvent OnEdit;

        private TModel _record;

        public void Delete() {
            OnDelete.Invoke(record);
        }

        public void Edit() {
            OnEdit.Invoke(record);
        }

        protected abstract void SetRecord(TModel record);

    }
}
