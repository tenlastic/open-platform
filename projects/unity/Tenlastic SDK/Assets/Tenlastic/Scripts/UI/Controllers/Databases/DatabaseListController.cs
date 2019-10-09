using Newtonsoft.Json.Linq;
using System.Threading.Tasks;
using UnityEngine;

namespace Tenlastic {
    public class DatabaseListController : ListController<DatabaseModel> {

        public CurrentNamespaceManager currentNamespaceManager;
        public DatabaseService databaseService;

        protected override Task<DatabaseModel[]> FindRecords() {
            string namespaceId = currentNamespaceManager.namespaceModel._id;
            JObject jObject = new JObject {
                {
                    "where", new JObject {
                        { "namespaceId", namespaceId }
                    }
                }
            };

            return databaseService.FindRecords(jObject);
        }

        protected override void SetRecord(GameObject gameObject, DatabaseModel record) {
            DatabaseItemController databaseItemController = gameObject.GetComponent<DatabaseItemController>();
            databaseItemController.record = record;
        }

    }
}
