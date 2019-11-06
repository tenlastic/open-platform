using UnityEngine;
using UnityEngine.Events;

namespace Tenlastic {
    public class DeleteDatabaseModalController : MonoBehaviour {

        public DatabaseService databaseService;
        public DatabaseModel record { get; set; }

        public UnityEventString OnError;
        public UnityEvent OnSuccess;

        public async void Delete() {
            try {
                await databaseService.DeleteRecord(record._id);
            } catch (HttpException ex) {
                OnError.Invoke(ex.Message);
                return;
            }

            OnSuccess.Invoke();
        }

    }
}
