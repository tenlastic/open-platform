using TMPro;

namespace Tenlastic {
    public class CollectionItemController : ListItemController<CollectionModel, UnityEventCollectionModel> {

        public TextMeshProUGUI nameText;

        protected override void SetRecord(CollectionModel record) {
            nameText.text = record.name;
        }

    }
}
