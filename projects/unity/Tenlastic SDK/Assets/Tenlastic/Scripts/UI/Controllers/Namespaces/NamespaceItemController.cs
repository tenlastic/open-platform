using TMPro;
using UnityEngine.UI;

namespace Tenlastic {
    public class NamespaceItemController : ListItemController<NamespaceModel, UnityEventNamespaceModel> {

        public CurrentNamespaceManager currentNamespaceManager;
        public TextMeshProUGUI nameText;
        public Button selectButton;
        public TextMeshProUGUI usersText;

        public void Select() {
            currentNamespaceManager.namespaceModel = record;
            ToggleSelectButton();
        }

        public void ToggleSelectButton() {
            if (record == null || currentNamespaceManager.namespaceModel == null) {
                return;
            }

            selectButton.gameObject.SetActive(record._id != currentNamespaceManager.namespaceModel._id);
        }

        protected override void SetRecord(NamespaceModel record) {
            nameText.text = record.name;

            int users = record.accessControlList.Length;
            usersText.text = string.Format("{0} User{1}", users, users > 1 ? "s" : "");

            ToggleSelectButton();
        }

    }
}
