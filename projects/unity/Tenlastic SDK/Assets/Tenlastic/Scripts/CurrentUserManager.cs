using UnityEngine;

namespace Tenlastic {
    public class CurrentUserManager : MonoBehaviour {

        public UserModel userModel {
            get {
                return _userModel;
            }
            set {
                _userModel = value;

                if (value != null) {
                    OnIdUpdated.Invoke(value._id);
                    OnEmailUpdated.Invoke(value.email);
                    OnUsernameUpdated.Invoke(value.username);
                }
            }
        }

        public UnityEventString OnIdUpdated;
        public UnityEventString OnEmailUpdated;
        public UnityEventString OnUsernameUpdated;

        private UserModel _userModel;

        private void Awake() {
            UserService.OnUpdateRecord += UserService_OnUpdateRecord;
        }

        private void OnDestroy() {
            UserService.OnUpdateRecord -= UserService_OnUpdateRecord;
        }

        public void Clear() {
            userModel = null;
        }

        private void UserService_OnUpdateRecord(UserModel userModel) {
            if (this.userModel._id != userModel._id) {
                return;
            }

            this.userModel = userModel;
        }

    }
}
