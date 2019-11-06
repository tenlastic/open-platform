using UnityEngine;
using UnityEngine.UI;

namespace Tenlastic {
    public class Layout : MonoBehaviour {

        public float interval = 1f;

        private void Start() {
            InvokeRepeating("Redraw", 0f, interval);
        }

        private void Redraw() {
            foreach (HorizontalOrVerticalLayoutGroup group in GetComponentsInChildren<HorizontalOrVerticalLayoutGroup>()) {
                LayoutRebuilder.ForceRebuildLayoutImmediate(group.GetComponent<RectTransform>());
            }
        }

    }
}
