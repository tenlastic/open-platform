using Newtonsoft.Json.Linq;
using System;
using System.Linq;
using System.Text.RegularExpressions;

namespace Tenlastic {
    public class CollectionService : Service<CollectionModel> {

        protected override string GetBaseUrl(JObject jObject) {
            string baseUrl = environmentManager.environmentObject.databaseApiBaseUrl;
            string databaseId;

            JToken databaseIdToken = jObject.GetValue("databaseId");
            if (databaseIdToken == null) {
                JToken whereToken = jObject.GetValue("where");
                if (whereToken == null) {
                    throw new ValidationException("databaseId", "Database is required.");
                }

                dynamic where = whereToken.ToObject<dynamic>();
                if (where.databaseId == null) {
                    throw new ValidationException("databaseId", "Database is required.");
                }

                databaseId = where.databaseId;
            } else {
                databaseId = databaseIdToken.ToObject<string>();
            }
            
            return baseUrl + "/" + databaseId + "/collections";
        }

        protected override Exception GetException(HttpException ex) {
            bool isNameTaken = ex.errors.Any(e => e.name == "UniquenessError" && e.paths.Contains("name"));
            if (isNameTaken) {
                return new ValidationException("name", "Name is already taken.");
            }

            return ex;
        }

        protected override void Validate(JObject jObject) {
            string databaseId = jObject.GetValue("databaseId").ToObject<string>();
            string name = jObject.GetValue("name").ToObject<string>();

            if (string.IsNullOrEmpty(databaseId)) {
                throw new ValidationException("databaseId", "Database is required.");
            }

            if (string.IsNullOrEmpty(name)) {
                throw new ValidationException("name", "Name is required.");
            }

            string regex = @"^[0-9a-z\-]{6,40}$";
            if (!Regex.IsMatch(name, regex)) {
                throw new ValidationException("name", "Name must be alphanumeric with hyphens between 6 and 40 characters.");
            }
        }

    }
}

