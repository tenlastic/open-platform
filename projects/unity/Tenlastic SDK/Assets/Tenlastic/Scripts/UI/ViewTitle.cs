using UnityEngine;

namespace Tenlastic {
    public class ViewTitle : MonoBehaviour {

        public string title {
            get {
                return _title;
            }
            set {
                _title = value;

                OnTitleChanged.Invoke(value);
            }
        }

        public UnityEventString OnTitleChanged;

        private string _title;

    }
}
