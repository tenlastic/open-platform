using System.Threading.Tasks;
using UnityEngine;

namespace Tenlastic {
    public class UserListController : ListController<UserModel> {

        public UserService userService;

        protected override Task<UserModel[]> FindRecords() {
            return userService.FindRecords(null);
        }

        protected override void SetRecord(GameObject gameObject, UserModel record) {
            UserItemController userItemController = gameObject.GetComponent<UserItemController>();
            userItemController.record = record;
        }

    }
}
