import { contextBridge, ipcRenderer } from "electron";

// Define types for our API
interface Secret {
  name: string;
  value: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface SecretMetadata {
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ResponseSuccess<T> {
  success: true;
  data: T;
}

interface ResponseError {
  success: false;
  error: string;
}

type Response<T> = ResponseSuccess<T> | ResponseError;

// Define our API interface
interface SecretsAPI {
  isEncryptionAvailable: () => Promise<boolean>;
  getAllSecrets: () => Promise<Response<SecretMetadata[]>>;
  getSecret: (name: string) => Promise<Response<Secret>>;
  saveSecret: (secretData: Secret) => Promise<Response<null>>;
  deleteSecret: (name: string) => Promise<Response<null>>;
  getAllSecretsWithValues: () => Promise<Response<Secret[]>>;
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("secretsAPI", {
  isEncryptionAvailable: () => ipcRenderer.invoke("check-encryption-available"),

  getAllSecrets: () => ipcRenderer.invoke("get-all-secrets"),

  getSecret: (name: string) => ipcRenderer.invoke("get-secret", name),

  saveSecret: (secretData: Secret) =>
    ipcRenderer.invoke("save-secret", secretData),

  deleteSecret: (name: string) => ipcRenderer.invoke("delete-secret", name),

  getAllSecretsWithValues: () =>
    ipcRenderer.invoke("get-all-secrets-with-values"),
} as SecretsAPI);
