using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace Tenlastic {
    public class BackButton : MonoBehaviour {

        public VerticalLayoutGroup content;
        public TextMeshProUGUI text;
        public StackedNavigation stackedNavigation;

        private int initialContentTopPadding;

        private void OnEnable() {
            initialContentTopPadding = content.padding.top;
        }

        public void UpdateButtonText() {
            if (stackedNavigation.views.Count > 1) {
                GameObject gameObject = stackedNavigation.views[stackedNavigation.views.Count - 2];
                text.text = string.Format("Back to {0}", gameObject.name);

                content.padding.top = initialContentTopPadding;
                text.transform.parent.gameObject.SetActive(true);
            } else {
                content.padding.top = 0;
                text.transform.parent.gameObject.SetActive(false);
            }
        }

    }
}
