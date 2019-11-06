using Newtonsoft.Json.Linq;
using System.Threading.Tasks;
using TMPro;

namespace Tenlastic {
    public class DatabaseFormController : FormController<DatabaseModel> {

        public CurrentNamespaceManager currentNamespaceManager;
        public DatabaseService databaseService;
        public TMP_InputField nameInput;
        public TextMeshProUGUI titleText;

        public override void SetRecord(DatabaseModel record) {
            this.record = record;

            gameObject.name = titleText.text = "Update Database";
            nameInput.text = record.name;
        }

        public override void UnsetRecord() {
            record = null;

            gameObject.name = titleText.text = "Create Database";
            nameInput.text = "";
        }

        protected override async Task CreateRecord() {
            JObject query = new JObject {
                { "name", nameInput.text },
                { "namespaceId", currentNamespaceManager.namespaceModel._id },
            };

            await databaseService.CreateRecord(query);
        }

        protected override async Task UpdateRecord() {
            JObject query = new JObject {
                { "_id", record._id },
                { "name", nameInput.text },
                { "namespaceId", currentNamespaceManager.namespaceModel._id },
            };

            await databaseService.UpdateRecord(query);
        }

    }
}
