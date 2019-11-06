using Newtonsoft.Json.Linq;
using System;
using System.Threading.Tasks;
using UnityEngine;

namespace Tenlastic {
    public class LoginService : MonoBehaviour {

        #pragma warning disable 0649
        [Serializable]
        private struct LogInResponse {
            public string accessToken;
            public string refreshToken;
        }
        #pragma warning restore 0649

        public AuthenticationManager authenticationManager;
        public CurrentUserManager currentUserManager;
        public EnvironmentManager environmentManager;
        public HttpManager httpManager;
        public TokenManager tokenManager;

        public async Task CreateWithCredentials(string email, string password) {
            JObject parameters = new JObject {
                { "email", email },
                { "password", password }
            };

            LogInResponse response = await httpManager.Request<LogInResponse>(
                HttpManager.HttpMethod.Post,
                environmentManager.environmentObject.loginApiBaseUrl,
                parameters
            );

            tokenManager.accessToken = response.accessToken;
            tokenManager.refreshToken = response.refreshToken;

            Jwt jwt = new Jwt(response.accessToken);
            currentUserManager.userModel = jwt.payload.user;
        }

        public async Task CreateWithRefreshToken(string token) {
            JObject parameters = new JObject {
                { "token", token }
            };

            LogInResponse response = await httpManager.Request<LogInResponse>(
                HttpManager.HttpMethod.Post,
                environmentManager.environmentObject.loginApiBaseUrl + "/refresh-token",
                parameters,
                true
            );

            tokenManager.accessToken = response.accessToken;
            tokenManager.refreshToken = response.refreshToken;

            Jwt jwt = new Jwt(response.accessToken);
            currentUserManager.userModel = jwt.payload.user;
        }

        public async Task LogOut() {
            await httpManager.Request(
                HttpManager.HttpMethod.Delete,
                environmentManager.environmentObject.loginApiBaseUrl,
                null
            );

            currentUserManager.Clear();
            tokenManager.Clear();
        }

    }
}
