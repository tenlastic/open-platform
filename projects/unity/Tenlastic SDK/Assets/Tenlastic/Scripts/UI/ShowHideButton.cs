using UnityEngine;
using UnityEngine.Events;

namespace Tenlastic {
    public class ShowHideButton : MonoBehaviour {

        public UnityEvent OnHide;
        public UnityEvent OnShow;

        private bool isShown = true;

        public void Hide() {
            isShown = false;

            OnHide.Invoke();
        }

        public void Show() {
            isShown = true;

            OnShow.Invoke();
        }

        public void Toggle() {
            isShown = !isShown;

            if (isShown) {
                OnShow.Invoke();
            } else {
                OnHide.Invoke();
            }
        }

    }
}
