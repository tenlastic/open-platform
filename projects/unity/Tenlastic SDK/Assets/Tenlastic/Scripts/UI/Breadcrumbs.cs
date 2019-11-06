using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace Tenlastic {
    public class Breadcrumbs : MonoBehaviour {

        public GameObject buttonTemplate;
        public GameObject separatorTemplate;
        public StackedNavigation stackedNavigation;
        public GameObject textTemplate;

        public void UpdateBreadcrumbs() {
            DestroyChildren();

            for (int i = 0; i < stackedNavigation.views.Count; i++) {
                GameObject view = stackedNavigation.views[i];

                if (i == stackedNavigation.views.Count - 1) {
                    GameObject gameObject = Instantiate(textTemplate, transform);

                    TextMeshProUGUI text = gameObject.GetComponentInChildren<TextMeshProUGUI>();
                    text.text = view.name;

                    gameObject.SetActive(true);
                } else {
                    GameObject gameObject = Instantiate(buttonTemplate, transform);

                    Button button = gameObject.GetComponentInChildren<Button>();
                    button.onClick.AddListener(() => stackedNavigation.PopTo(view));

                    TextMeshProUGUI text = gameObject.GetComponentInChildren<TextMeshProUGUI>();
                    text.text = view.name;

                    gameObject.SetActive(true);

                    GameObject separator = Instantiate(separatorTemplate, transform);
                    separator.SetActive(true);
                }
            }
        }

        private void DestroyChildren() {
            foreach (Transform child in transform) {
                if (
                    child.gameObject == buttonTemplate ||
                    child.gameObject == separatorTemplate ||
                    child.gameObject == textTemplate
                ) {
                    child.gameObject.SetActive(false);
                } else {
                    Destroy(child.gameObject);
                }

            }
        }

    }
}
