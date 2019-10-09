using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Text;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.Events;
using UnityEngine.Networking;

namespace Tenlastic {
    public class HttpManager : MonoBehaviour {

        public enum HttpMethod {
            Delete,
            Get,
            Post,
            Put
        }

        public LoginService loginService;
        public TokenManager tokenManager;

        public UnityEvent OnUnauthorizedRequest;

        private bool isRefreshingToken;

        public async Task<string> Request(HttpMethod method, string url, JObject parameters, bool skipRefreshToken = false) {
            if (!skipRefreshToken) {
                await RefreshAccessToken();
            }

            string queryString = "";
            if ((method == HttpMethod.Delete || method == HttpMethod.Get) && parameters != null) {
                queryString = "?query=" + parameters.ToString(Formatting.None);
            }

            UnityWebRequest request;
            switch (method) {
                case HttpMethod.Delete:
                    request = new UnityWebRequest(url + queryString);
                    request.downloadHandler = new DownloadHandlerBuffer();
                    request.method = UnityWebRequest.kHttpVerbDELETE;
                    break;

                case HttpMethod.Get:
                    request = new UnityWebRequest(url + queryString);
                    request.downloadHandler = new DownloadHandlerBuffer();
                    request.method = UnityWebRequest.kHttpVerbGET;
                    break;

                case HttpMethod.Post:
                    request = new UnityWebRequest(url);
                    request.downloadHandler = new DownloadHandlerBuffer();
                    request.method = UnityWebRequest.kHttpVerbPOST;

                    if (parameters != null) {
                        byte[] bytes = Encoding.UTF8.GetBytes(parameters.ToString(Formatting.None));
                        request.uploadHandler = new UploadHandlerRaw(bytes);
                        request.uploadHandler.contentType = "application/json";
                    }

                    break;

                case HttpMethod.Put:
                    request = new UnityWebRequest(url);
                    request.downloadHandler = new DownloadHandlerBuffer();
                    request.method = UnityWebRequest.kHttpVerbPUT;

                    if (parameters != null) {
                        byte[] bytes = Encoding.UTF8.GetBytes(parameters.ToString(Formatting.None));
                        request.uploadHandler = new UploadHandlerRaw(bytes);
                        request.uploadHandler.contentType = "application/json";
                    }

                    break;

                default:
                    request = null;
                    break;
            }

            request.SetRequestHeader("Authorization", string.Format("Bearer {0}", tokenManager.accessToken));
            request.SetRequestHeader("Content-Type", "application/json");

            await request.SendWebRequest();

            string body = request.downloadHandler.text;
            switch (request.responseCode) {
                case 200:
                    return body;

                case 401:
                    throw new HttpException(401, "Unauthorized.");

                case 403:
                    throw new HttpException(403, "Forbidden.");

                default:
                    HttpException.HttpErrors errors = JsonUtility.FromJson<HttpException.HttpErrors>(body);
                    throw new HttpException((int)request.responseCode, errors.errors);
            }
        }

        public async Task<T> Request<T>(HttpMethod method, string url, JObject parameters, bool skipRefreshToken = false) {
            string body = await Request(method, url, parameters, skipRefreshToken);
            return JsonUtility.FromJson<T>(body);
        }

        private async Task RefreshAccessToken() {
            await TaskExtensionMethods.WaitUntil(() => !isRefreshingToken, 25, 6000);

            if (string.IsNullOrEmpty(tokenManager.accessToken) || string.IsNullOrEmpty(tokenManager.refreshToken)) {
                return;
            }

            Jwt accessToken = new Jwt(tokenManager.accessToken);
            if (!accessToken.isExpired) {
                return;
            }

            Jwt refreshToken = new Jwt(tokenManager.refreshToken);
            if (refreshToken.isExpired) {
                OnUnauthorizedRequest.Invoke();
                return;
            }

            isRefreshingToken = true;

            try {
                await loginService.CreateWithRefreshToken(tokenManager.refreshToken);
            } catch (HttpException) {
                OnUnauthorizedRequest.Invoke();
            }

            isRefreshingToken = false;
        }

    }
}
