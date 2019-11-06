using System.Threading.Tasks;
using UnityEngine;

namespace Tenlastic {
    public class NamespaceListController : ListController<NamespaceModel> {

        public NamespaceService namespaceService;

        protected override Task<NamespaceModel[]> FindRecords() {
            return namespaceService.FindRecords(null);
        }

        protected override void SetRecord(GameObject gameObject, NamespaceModel record) {
            NamespaceItemController namespaceItemController = gameObject.GetComponent<NamespaceItemController>();
            namespaceItemController.record = record;
        }

    }
}
