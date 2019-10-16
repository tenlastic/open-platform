using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;

namespace Tenlastic {
    [Serializable]
    public class CollectionModel {

        [Serializable]
        public struct BooleanPermissions {
            public bool @base;
            public dynamic roles;
        }

        [Serializable]
        public struct DynamicPermissions {
            public dynamic @base;
            public dynamic roles;
        }

        [Serializable]
        public struct Index {
            public dynamic key;
            public IndexOptions options;
        }

        [Serializable]
        public struct IndexOptions {
            public int expireAfterSeconds;
            public dynamic partialFilterExpression;
            public bool unique;
        }

        [Serializable]
        public class JsonSchemaProperty {
            public bool additionalProperties;
            public dynamic @default;
            public string format;
            public JsonSchemaProperties properties;
            public string type;
        }

        [Serializable]
        public class JsonSchemaProperties : Dictionary<string, JsonSchemaProperty> { }

        [Serializable]
        public struct Permissions {
            public StringPermissions create;
            public BooleanPermissions delete;
            public DynamicPermissions find;
            public PopulatePermissions[] populate;
            public StringPermissions read;
            public RolePermissions[] roles;
            public StringPermissions update;
        }

        [Serializable]
        public class PopulatePermissions {
            public string path;
            public PopulatePermissions populate;
        }

        [Serializable]
        public struct RolePermissions {
            public string name;
            public dynamic query;
        }

        [Serializable]
        public struct StringPermissions {
            public string[] @base;
            public dynamic roles;
        }

        public string _id;
        public DateTime createdAt;
        public string databaseId;
        public Index[] indexes;
        public JsonSchemaProperty jsonSchema;
        public string name;
        public Permissions permissions;
        public DateTime updatedAt;

    }
}
