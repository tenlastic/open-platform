using UnityEngine;

namespace Tenlastic {
    [CreateAssetMenu(fileName = "Environment", menuName = "Scriptable Object/Environment")]
    public class EnvironmentObject : ScriptableObject {

        public EnvironmentObject environmentObject;
        public string databaseApiBaseUrl {
            get {
                return environmentObject?.databaseApiBaseUrl ?? _databaseApiBaseUrl;
            }
        }
        public string loginApiBaseUrl {
            get {
                return environmentObject?.loginApiBaseUrl ?? _loginApiBaseUrl;
            }
        }
        public string namespaceApiBaseUrl {
            get {
                return environmentObject?.namespaceApiBaseUrl ?? _namespaceApiBaseUrl;
            }
        }
        public string passwordResetApiBaseUrl {
            get {
                return environmentObject?.passwordResetApiBaseUrl ?? _passwordResetApiBaseUrl;
            }
        }
        public string userApiBaseUrl {
            get {
                return environmentObject?.userApiBaseUrl ?? _userApiBaseUrl;
            }
        }


        [SerializeField] private string _databaseApiBaseUrl = null;
        [SerializeField] private string _loginApiBaseUrl = null;
        [SerializeField] private string _namespaceApiBaseUrl = null;
        [SerializeField] private string _passwordResetApiBaseUrl = null;
        [SerializeField] private string _userApiBaseUrl = null;

    }
}
