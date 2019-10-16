using TMPro;

namespace Tenlastic {
    public class DatabaseItemController : ListItemController<DatabaseModel, UnityEventDatabaseModel> {

        public TextMeshProUGUI nameText;

        public UnityEventDatabaseModel OnCollections;

        public void Collections() {
            OnCollections.Invoke(record);
        }

        protected override void SetRecord(DatabaseModel record) {
            nameText.text = record.name;
        }

    }
}
