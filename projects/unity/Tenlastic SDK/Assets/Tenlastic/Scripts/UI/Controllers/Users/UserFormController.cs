using Newtonsoft.Json.Linq;
using System.Threading.Tasks;
using TMPro;

namespace Tenlastic {
    public class UserFormController : FormController<UserModel> {

        public TMP_InputField emailInput;
        public TMP_InputField rolesInput;
        public TextMeshProUGUI titleText;
        public UserService userService;
        public TMP_InputField usernameInput;

        public override void SetRecord() {
            titleText.text = "Update User";

            emailInput.text = record.email;
            rolesInput.text = string.Join(",", record.roles);
            usernameInput.text = record.username;
        }

        public override void UnsetRecord() {
            titleText.text = "Create User";

            emailInput.text = "";
            rolesInput.text = "";
            usernameInput.text = "";
        }

        protected override async Task CreateRecord() {
            JObject query = new JObject {
                { "email", emailInput.text },
                { "roles", new JArray(rolesInput.text.Split(',')) },
                { "username", usernameInput.text }
            };

            await userService.CreateRecord(query);
        }

        protected override async Task UpdateRecord() {
            JObject query = new JObject {
                { "_id", record._id },
                { "email", emailInput.text },
                { "roles", new JArray(rolesInput.text.Split(',')) },
                { "username", usernameInput.text }
            };

            await userService.UpdateRecord(query);
        }

    }
}
