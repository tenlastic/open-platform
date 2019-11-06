using System;

namespace Tenlastic {
    [Serializable]
    public class NamespaceModel {

        [Serializable]
        public struct AccessControlListItem {
            public string _id;
            public DateTime createdAt;
            public string[] roles;
            public DateTime updatedAt;
            public string userId;
        }

        public string _id;
        public AccessControlListItem[] accessControlList;
        public DateTime createdAt;
        public string name;
        public DateTime updatedAt;

    }
}
