using TMPro;

namespace Tenlastic {
    public class DatabaseItemController : ListItemController<DatabaseModel, UnityEventDatabaseModel> {

        public TextMeshProUGUI nameText;

        protected override void SetRecord(DatabaseModel record) {
            nameText.text = record.name;
        }

    }
}
