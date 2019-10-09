using Newtonsoft.Json.Linq;
using System;
using System.Threading.Tasks;
using UnityEngine;

namespace Tenlastic {
    public abstract class Service<TModel> : MonoBehaviour {

        #pragma warning disable 0649
        [Serializable]
        private struct RecordResponse {
            public TModel record;
        }

        [Serializable]
        private struct RecordsResponse {
            public TModel[] records;
        }
        #pragma warning restore 0649

        public EnvironmentManager environmentManager;
        public HttpManager httpManager;

        public delegate void OnCreateRecordDelegate(TModel record);
        public static event OnCreateRecordDelegate OnCreateRecord;

        public delegate void OnDeleteRecordDelegate(string _id);
        public static event OnDeleteRecordDelegate OnDeleteRecord;

        public delegate void OnUpdateRecordDelegate(TModel record);
        public static event OnUpdateRecordDelegate OnUpdateRecord;

        public async Task<TModel> CreateRecord(JObject jObject) {
            Validate(jObject);

            try {
                RecordResponse response = await httpManager.Request<RecordResponse>(
                    HttpManager.HttpMethod.Post,
                    GetBaseUrl(jObject),
                    jObject
                );

                if (OnCreateRecord != null) {
                    OnCreateRecord.Invoke(response.record);
                }

                return response.record;
            } catch (HttpException ex) {
                throw GetException(ex);
            }
        }

        public async Task DeleteRecord(string _id) {
            JObject jObject = new JObject {
                { "_id", _id }
            };

            await httpManager.Request(
                HttpManager.HttpMethod.Delete,
                GetBaseUrl(jObject) + "/" + _id,
                null
            );

            if (OnDeleteRecord != null) {
                OnDeleteRecord.Invoke(_id);
            }
        }

        public async Task<TModel> FindRecordById(string _id) {
            JObject jObject = new JObject {
                { "_id", _id }
            };

            RecordResponse response = await httpManager.Request<RecordResponse>(
                HttpManager.HttpMethod.Get,
                GetBaseUrl(jObject) + "/" + _id,
                null
            );

            return response.record;
        }

        public async Task<TModel[]> FindRecords(JObject jObject) {
            RecordsResponse response = await httpManager.Request<RecordsResponse>(
                HttpManager.HttpMethod.Get,
                GetBaseUrl(jObject),
                jObject
            );

            return response.records;
        }

        public async Task<TModel> UpdateRecord(JObject jObject) {
            Validate(jObject);

            try {
                RecordResponse response = await httpManager.Request<RecordResponse>(
                    HttpManager.HttpMethod.Put,
                    GetBaseUrl(jObject) + "/" + jObject.GetValue("_id").ToObject<string>(),
                    jObject
                );

                if (OnUpdateRecord != null) {
                    OnUpdateRecord.Invoke(response.record);
                }

                return response.record;
            } catch (HttpException ex) {
                throw GetException(ex);
            }
        }

        protected abstract string GetBaseUrl(JObject jObject);

        protected virtual Exception GetException(HttpException ex) {
            return ex;
        }

        protected virtual void Validate(JObject jObject) { }

    }
}

