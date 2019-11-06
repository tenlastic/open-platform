using TMPro;
using UnityEngine;

namespace Tenlastic {
    public class UserItemController : ListItemController<UserModel, UnityEventUserModel> {

        public TextMeshProUGUI usernameText;

        protected override void SetRecord(UserModel record) {
            usernameText.text = record.username;
        }

    }
}
