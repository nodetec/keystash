interface Window {
  secretsAPI: {
    isEncryptionAvailable: () => Promise<boolean>;
    getAllSecrets: () => Promise<{
      success: boolean;
      data?: {
        name: string;
        description?: string;
        createdAt?: string;
        updatedAt?: string;
      }[];
      error?: string;
    }>;
    getSecret: (name: string) => Promise<{
      success: boolean;
      data?: {
        name: string;
        value: string;
        description?: string;
        createdAt?: string;
        updatedAt?: string;
      };
      error?: string;
    }>;
    saveSecret: (secretData: {
      name: string;
      value: string;
      description?: string;
    }) => Promise<{
      success: boolean;
      error?: string;
    }>;
    deleteSecret: (name: string) => Promise<{
      success: boolean;
      error?: string;
    }>;
    getAllSecretsWithValues: () => Promise<{
      success: boolean;
      data?: {
        name: string;
        value: string;
        description?: string;
        createdAt?: string;
        updatedAt?: string;
      }[];
      error?: string;
    }>;
  };
}
