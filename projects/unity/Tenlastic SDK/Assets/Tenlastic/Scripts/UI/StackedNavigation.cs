using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Events;

namespace Tenlastic {
    public class StackedNavigation : MonoBehaviour {

        [HideInInspector]
        public List<GameObject> views = new List<GameObject>();

        public UnityEvent OnViewsChanged;

        public void Pop() {
            if (views.Count == 0) {
                return;
            }

            GameObject viewToPop = Peek();
            Destroy(viewToPop);

            views.Remove(viewToPop);

            ShowLastView();

            OnViewsChanged.Invoke();
        }

        public void PopTo(GameObject view) {
            GameObject lastView = Peek();
            if (lastView == view) {
                return;
            }

            Pop();
        }

        public void Push(GameObject view) {
            HideLastView();

            GameObject copy = Instantiate(view, transform);
            copy.name = view.name;
            copy.SetActive(true);

            views.Add(copy);

            OnViewsChanged.Invoke();
        }

        public void SetRoot(GameObject view) {
            while (views.Count > 0) {
                GameObject viewToPop = Peek();
                Destroy(viewToPop);

                views.Remove(viewToPop);
            }

            Push(view);
        }

        private void HideLastView() {
            GameObject lastView = Peek();

            if (lastView != null) {
                lastView.SetActive(false);
            }
        }

        private GameObject Peek() {
            return views.Count > 0 ? views[views.Count - 1] : null;
        }

        private void ShowLastView() {
            GameObject viewToShow = Peek();

            if (viewToShow != null) {
                viewToShow.SetActive(true);
            }
        }

    }
}
