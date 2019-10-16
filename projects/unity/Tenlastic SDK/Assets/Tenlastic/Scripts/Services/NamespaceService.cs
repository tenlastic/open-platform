using Newtonsoft.Json.Linq;
using System;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using UnityEngine;

namespace Tenlastic {
    public class NamespaceService : Service<NamespaceModel> {

        public struct RolesUsername {
            public string[] roles;
            public string username;
        }

        public UserService userService;

        public async Task<NamespaceModel.AccessControlListItem[]> GetAcl(RolesUsername[] input) {
            string[] usernames = input.Select(i => i.username).ToArray();

            // Find Users with provided usernames.
            JObject userQuery = new JObject {
                {
                    "where", new JObject {
                        {
                            "username", new JObject {
                                { "$in", new JArray(usernames) }
                            }
                        }
                    }
                }
            };
            UserModel[] userModels = await userService.FindRecords(userQuery);

            // If provided username is not valid, throw an error.
            string[] missingUsernames = usernames.Except(userModels.Select(u => u.username)).ToArray();
            if (missingUsernames.Length > 0) {
                throw new ValidationException("accessControlList", "Username not found: " + missingUsernames[0] + ".");
            }

            return userModels.Select(u => {
                RolesUsername rolesUsername = input.First(i => i.username == u.username);

                return new NamespaceModel.AccessControlListItem {
                    roles = rolesUsername.roles,
                    userId = u._id
                };
            }).ToArray();
        }

        protected override string GetBaseUrl(JObject jObject) {
            return environmentManager.environmentObject.namespaceApiBaseUrl;
        }

        protected override Exception GetException(HttpException ex) {
            bool isNameTaken = ex.errors.Any(e => e.name == "UniquenessError" && e.paths.Contains("name"));
            if (isNameTaken) {
                return new ValidationException("name", "Name is already taken.");
            }

            return ex;
        }

        protected override void Validate(JObject jObject) {
            string name = jObject.GetValue("name").ToObject<string>();

            if (string.IsNullOrEmpty(name)) {
                throw new ValidationException("name", "Name is required.");
            }

            string regex = @"^[0-9a-z\-]{6,40}$";
            if (!Regex.IsMatch(name, regex)) {
                throw new ValidationException("name", "Name must be alphanumeric with hyphens and between 6 to 40 characters.");
            }
        }

    }
}

