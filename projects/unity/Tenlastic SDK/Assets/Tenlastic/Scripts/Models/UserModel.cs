using System;

namespace Tenlastic {
    [Serializable]
    public class UserModel {

        public string _id;
        public DateTime createdAt;
        public string email;
        public string password;
        public string[] roles;
        public DateTime updatedAt;
        public string username;

    }
}
