import fs from "fs";
import path from "path";

import { app, ipcMain, type IpcMainInvokeEvent, safeStorage } from "electron";
import Store from "electron-store";

// Define types for our secrets
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

interface SecretsStore {
  secrets: Secret[];
}

// Define our store schema
interface StoreSchema {
  secretNames: string[];
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

// Initialize electron-store for tracking secret names
const store = new Store<StoreSchema>({
  name: "secrets-index", // The name of the file (without extension)
  defaults: {
    secretNames: [],
  },
});

// Path for the encrypted storage file
const SECRETS_FILE = path.join(app.getPath("userData"), "secrets.encrypted");

// Helper function to load the secrets
function loadSecrets(): SecretsStore {
  try {
    if (!fs.existsSync(SECRETS_FILE)) {
      return { secrets: [] };
    }

    const encryptedData = fs.readFileSync(SECRETS_FILE);
    const decryptedString = safeStorage.decryptString(encryptedData);
    return JSON.parse(decryptedString) as SecretsStore;
  } catch (error) {
    console.error("Error loading secrets:", error);
    return { secrets: [] };
  }
}

// Helper function to save the secrets
function saveSecrets(secretsObj: SecretsStore): boolean {
  try {
    const jsonString = JSON.stringify(secretsObj);
    const encryptedData = safeStorage.encryptString(jsonString);
    fs.writeFileSync(SECRETS_FILE, encryptedData);

    // Update the list of secret names in electron-store
    const secretNames = secretsObj.secrets.map((secret) => secret.name);
    store.set("secretNames", secretNames);

    return true;
  } catch (error) {
    console.error("Error saving secrets:", error);
    return false;
  }
}

// Helper function to check if a secret exists without decrypting
function secretExists(name: string): boolean {
  const secretNames = store.get("secretNames", []);
  return secretNames.includes(name);
}

// Set up IPC handlers
ipcMain.handle("check-encryption-available", (): boolean => {
  return safeStorage.isEncryptionAvailable();
});

// Get all secret names (without decrypting)
ipcMain.handle("get-all-secret-names", (): Response<string[]> => {
  try {
    const secretNames = store.get("secretNames", []);
    return { success: true, data: secretNames };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: errorMessage };
  }
});

// Get all secrets metadata (requires decryption)
ipcMain.handle("get-all-secrets", (): Response<SecretMetadata[]> => {
  try {
    const secretsObj = loadSecrets();
    // Return just the metadata without values for the listing
    const secretsList = secretsObj.secrets.map((item) => ({
      name: item.name,
      description: item.description,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    return { success: true, data: secretsList };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: errorMessage };
  }
});

// Check if a secret exists without decrypting
ipcMain.handle(
  "check-secret-exists",
  (_event: IpcMainInvokeEvent, secretName: string): Response<boolean> => {
    try {
      const exists = secretExists(secretName);
      return { success: true, data: exists };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return { success: false, error: errorMessage };
    }
  },
);

// Get a specific secret by name
ipcMain.handle(
  "get-secret",
  (_event: IpcMainInvokeEvent, secretName: string): Response<Secret> => {
    try {
      // First check if the secret exists without decrypting
      if (!secretExists(secretName)) {
        return { success: false, error: "Secret not found" };
      }

      const secretsObj = loadSecrets();
      const secret = secretsObj.secrets.find((s) => s.name === secretName);

      if (secret) {
        return { success: true, data: secret };
      } else {
        // This should rarely happen, but handle the case where the index is out of sync
        return { success: false, error: "Secret not found (index mismatch)" };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return { success: false, error: errorMessage };
    }
  },
);

// Add or update a secret
ipcMain.handle(
  "save-secret",
  (_event: IpcMainInvokeEvent, secretData: Secret): Response<null> => {
    try {
      // Validate input
      if (!secretData.name || secretData.value === undefined) {
        return { success: false, error: "Name and value are required" };
      }

      const secretsObj = loadSecrets();
      const now = new Date().toISOString();
      const existingIndex = secretsObj.secrets.findIndex(
        (s) => s.name === secretData.name,
      );

      if (existingIndex >= 0) {
        // Update existing secret
        secretsObj.secrets[existingIndex] = {
          ...secretData,
          updatedAt: now,
          createdAt: secretsObj.secrets[existingIndex].createdAt || now,
        };
      } else {
        // Add new secret
        secretsObj.secrets.push({
          ...secretData,
          createdAt: now,
          updatedAt: now,
        });
      }

      const saved = saveSecrets(secretsObj);
      if (saved) {
        return { success: true, data: null };
      } else {
        return { success: false, error: "Failed to save secrets" };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return { success: false, error: errorMessage };
    }
  },
);

// Delete a secret
ipcMain.handle(
  "delete-secret",
  (_event: IpcMainInvokeEvent, secretName: string): Response<null> => {
    try {
      // First check if the secret exists without decrypting
      if (!secretExists(secretName)) {
        return { success: false, error: "Secret not found" };
      }

      const secretsObj = loadSecrets();

      secretsObj.secrets = secretsObj.secrets.filter(
        (s) => s.name !== secretName,
      );

      const saved = saveSecrets(secretsObj);
      if (saved) {
        return { success: true, data: null };
      } else {
        return { success: false, error: "Failed to save after deletion" };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return { success: false, error: errorMessage };
    }
  },
);

// Sync the index with the encrypted store (for recovery purposes)
ipcMain.handle("sync-secret-names", (): Response<null> => {
  try {
    const secretsObj = loadSecrets();
    const secretNames = secretsObj.secrets.map((secret) => secret.name);
    store.set("secretNames", secretNames);
    return { success: true, data: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: errorMessage };
  }
});
