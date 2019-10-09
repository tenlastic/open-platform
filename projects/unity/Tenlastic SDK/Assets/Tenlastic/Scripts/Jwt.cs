using JWT.Builder;
using System;
using UnityEngine;

namespace Tenlastic {
    public class Jwt {

        [Serializable]
        public struct Payload {
            public int exp;
            public int iat;
            public string jti;
            public UserModel user;
        }

        public bool isExpired {
            get {
                DateTimeOffset now = DateTimeOffset.Now;
                DateTimeOffset exp = DateTimeOffset.FromUnixTimeSeconds(payload.exp);

                return DateTimeOffset.Compare(exp, now) < 0;
            }
        }
        public Payload payload {
            get {
                return _payload;
            }
        }
        public string value {
            get {
                return _value;
            }
            set {
                _value = value;

                string json = new JwtBuilder().Decode(value);
                _payload = JsonUtility.FromJson<Payload>(json);
            }
        }

        private Payload _payload;
        private string _value;

        public Jwt(string value) {
            this.value = value;
        }

    }
}

