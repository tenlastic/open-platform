using UnityEngine;
using UnityEngine.Events;

namespace Tenlastic {
    public class DeleteUserModalController : MonoBehaviour {

        public UserModel userModel { get; set; }
        public UserService userService;

        public UnityEventString OnError;
        public UnityEvent OnSuccess;

        public async void Delete() {
            try {
                await userService.DeleteRecord(userModel._id);
            } catch (HttpException ex) {
                OnError.Invoke(ex.Message);
                return;
            }

            OnSuccess.Invoke();
        }

    }
}
