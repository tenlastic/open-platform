using UnityEngine;
using UnityEngine.Events;

namespace Tenlastic {
    public class LifecycleEvents : MonoBehaviour {

        public UnityEvent OnAwoken;
        public UnityEvent OnDisabled;
        public UnityEvent OnEnabled;
        public UnityEvent OnStarted;

        private void Awake() {
            OnAwoken.Invoke();
        }

        private void OnDisable() {
            OnDisabled.Invoke();
        }

        private void OnEnable() {
            OnEnabled.Invoke();
        }

        private void Start() {
            OnStarted.Invoke();
        }

    }
}

