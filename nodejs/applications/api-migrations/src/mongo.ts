import {
  AuthorizationModel,
  AuthorizationRequestModel,
  connect,
  enablePrePostImages,
  LoginModel,
  NamespaceModel,
  PasswordResetModel,
  RefreshTokenModel,
  SchemaSchema,
  SteamIntegrationModel,
  syncIndexes,
  UserModel,
  WebSocketModel,
} from '@tenlastic/mongoose';
import { getModelForClass } from '@typegoose/typegoose';

export async function mongo(connectionString: string, databaseName: string) {
  const connection = await connect({ connectionString, databaseName });
  const SchemaModel = getModelForClass(SchemaSchema);

  console.log('Syncing indexes...');
  await Promise.all([
    syncIndexes(AuthorizationModel),
    syncIndexes(AuthorizationRequestModel),
    syncIndexes(LoginModel),
    syncIndexes(NamespaceModel),
    syncIndexes(PasswordResetModel),
    syncIndexes(RefreshTokenModel),
    syncIndexes(SchemaModel),
    syncIndexes(SteamIntegrationModel),
    syncIndexes(UserModel),
    syncIndexes(WebSocketModel),
  ]);
  console.log('Indexes synced successfully!');

  console.log('Syncing schemas...');
  await Promise.all([
    SchemaModel.sync(AuthorizationModel),
    SchemaModel.sync(AuthorizationRequestModel),
    SchemaModel.sync(LoginModel),
    SchemaModel.sync(NamespaceModel),
    SchemaModel.sync(PasswordResetModel),
    SchemaModel.sync(RefreshTokenModel),
    SchemaModel.sync(SteamIntegrationModel),
    SchemaModel.sync(UserModel),
    SchemaModel.sync(WebSocketModel),
  ]);
  console.log('Schemas synced successfully!');

  console.log('Setting feature compatibility version to 6.0...');
  await connection.db.admin().command({ setFeatureCompatibilityVersion: '6.0' });
  console.log('Feature compatibility version successfully set to 6.0!');

  console.log('Enabling Document Pre- and Post-Images...');
  await Promise.all([
    enablePrePostImages(AuthorizationModel),
    enablePrePostImages(AuthorizationRequestModel),
    enablePrePostImages(LoginModel),
    enablePrePostImages(NamespaceModel),
    enablePrePostImages(PasswordResetModel),
    enablePrePostImages(RefreshTokenModel),
    enablePrePostImages(SteamIntegrationModel),
    enablePrePostImages(UserModel),
    enablePrePostImages(WebSocketModel),
  ]);
  console.log('Document Pre- and Post-Images enabled successfully!');
}
