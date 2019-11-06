using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace Tenlastic {
    public class BackButton : MonoBehaviour {

        public TextMeshProUGUI text;
        public StackedNavigation stackedNavigation;

        public void UpdateButtonText() {
            if (stackedNavigation.views.Count > 1) {
                GameObject gameObject = stackedNavigation.views[stackedNavigation.views.Count - 2];
                text.text = string.Format("Back to {0}", gameObject.name);

                this.gameObject.SetActive(true);
            } else {
                gameObject.SetActive(false);
            }
        }

    }
}
