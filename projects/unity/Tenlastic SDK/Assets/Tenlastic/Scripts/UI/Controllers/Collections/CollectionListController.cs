using Newtonsoft.Json.Linq;
using System.Threading.Tasks;
using UnityEngine;

namespace Tenlastic {
    public class CollectionListController : ListController<CollectionModel> {

        public CollectionService collectionService;

        [HideInInspector]
        public DatabaseModel databaseModel;

        public void SetDatabaseModel(DatabaseModel databaseModel) {
            this.databaseModel = databaseModel;
        }

        protected override Task<CollectionModel[]> FindRecords() {
            string databaseId = databaseModel._id;
            JObject jObject = new JObject {
                {
                    "where", new JObject {
                        { "databaseId", databaseId }
                    }
                }
            };

            return collectionService.FindRecords(jObject);
        }

        protected override void SetRecord(GameObject gameObject, CollectionModel record) {
            CollectionItemController collectionItemController = gameObject.GetComponent<CollectionItemController>();
            collectionItemController.record = record;
        }

    }
}
