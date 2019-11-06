using UnityEngine;
using UnityEngine.Events;

namespace Tenlastic {
    public class DeleteCollectionModalController : MonoBehaviour {

        public CollectionService collectionService;
        public CollectionModel record { get; set; }

        public UnityEventString OnError;
        public UnityEvent OnSuccess;

        public async void Delete() {
            try {
                await collectionService.DeleteRecord(record._id);
            } catch (HttpException ex) {
                OnError.Invoke(ex.Message);
                return;
            }

            OnSuccess.Invoke();
        }

    }
}
