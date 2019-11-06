using Newtonsoft.Json.Linq;
using System.Threading.Tasks;
using UnityEngine;

namespace Tenlastic {
    public class PasswordResetService : MonoBehaviour {

        public EnvironmentManager environmentManager;
        public HttpManager httpManager;

        public Task CreateRecord(JObject jObject) {
            return httpManager.Request(
                HttpManager.HttpMethod.Post, 
                environmentManager.environmentObject.passwordResetApiBaseUrl, 
                jObject
            );
        }

    }
}
