/**
 * Auto-generated axios-based API client
 * Usage:
 *   import { createApiClient } from 'app-api-client'
 *   const api = await createApiClient({ axiosClient })
 *   const userData = await api.auth.login({ body: { email, password } })
 */

      export async function createApiClient(opts = {}) {
        const { axiosClient, ...otherOpts } = opts;

        if (!axiosClient) {
          throw new Error('axiosClient is required for API client');
        }

        // Helper to extract full response
function extractFullResponse(res) {
  return res?.data || {};
}

// Helper to extract data from API response format
function extractData(res) {
  const response = extractFullResponse(res);
  if (response.success && response.data !== undefined) return response.data;
  // Handle error responses
  if (!response.success && response.error) {
    const error = new Error(response.error.message || 'API Error');
    error.code = response.error.code;
    error.type = response.error.type;
    error.details = response.error.details;
    error.meta = response.meta;
    throw error;
  }
  // Return response directly if not in standard format
  return response;
}

// Helper to extract pagination info
function extractPaginationMeta(res) {
  const response = extractFullResponse(res);
  return response?.meta?.pagination || null;
}

// Build axios request config from API client request
function buildAxiosConfig(request, path, method) {
  const config = {
    url: path,
    method: method.toLowerCase(),
  };
  if (request?.body) {
    config.data = request.body;
  }
  if (request?.query) {
    config.params = request.query;
  }
  if (request?.path) {
    // Replace path parameters in URL
    let finalPath = path;
    for (const [key, value] of Object.entries(request.path)) {
      finalPath = finalPath.replace(`{${key}}`, encodeURIComponent(value));
    }
    config.url = finalPath;
  }
  return config;
}

        // Initialize namespace groups
        const index = {
              auth: {},
    content: {},
    coursewareAssistant: {},
    currentUser: {},
    health: {},
    integrationOAuthClients: {},
    integrations: {},
    learning: {},
    oAuthToken: {},
    oidc: {},
    scenario: {},
    seed: {},
    user: {},
    webhooks: {},
          _axiosClient: axiosClient,
          extractData,
          extractFullResponse,
          extractPaginationMeta
        };

        // Generate axios-based methods
        // User login
index.auth.login = async (request = {}) => {
  const axiosConfig =
    buildAxiosConfig(request, '/auth/login', 'POST');
  try {
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response)
    };
  } catch (err) {
    // Debug: log the error structure
    console.log('API Client Error:', {
      hasResponse: !!err.response,
      hasRequest: !!err.request,
      status: err.response?.status,
      message: err.message,
      errorKeys: Object.keys(err)
    });
    // Handle axios errors (4xx, 5xx status codes)
    if (err.response) {
      return {
        statusCode: err.response.status,
        headers: err.response.headers || {},
        body: err.response.data,
        data: err.response.data // Use raw error response data instead of extractData
      };
    }
    // Handle request errors (no response received)
    if (err.request) {
      return {
        statusCode: 0,
        headers: {},
        body: null,
        data: { error: 'No response received from server' }
      };
    }
    // Re-throw other errors (network errors, etc.)
    throw err;
  }
};
// Add raw method that returns full axios response
index.auth.login.raw =
  async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/auth/login',
      'POST');
    return await axiosClient.request(axiosConfig);
};
// User logout
index.auth.logout = async (request = {}) => {
  const axiosConfig =
    buildAxiosConfig(request, '/auth/logout', 'GET');
  try {
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response)
    };
  } catch (err) {
    // Debug: log the error structure
    console.log('API Client Error:', {
      hasResponse: !!err.response,
      hasRequest: !!err.request,
      status: err.response?.status,
      message: err.message,
      errorKeys: Object.keys(err)
    });
    // Handle axios errors (4xx, 5xx status codes)
    if (err.response) {
      return {
        statusCode: err.response.status,
        headers: err.response.headers || {},
        body: err.response.data,
        data: err.response.data // Use raw error response data instead of extractData
      };
    }
    // Handle request errors (no response received)
    if (err.request) {
      return {
        statusCode: 0,
        headers: {},
        body: null,
        data: { error: 'No response received from server' }
      };
    }
    // Re-throw other errors (network errors, etc.)
    throw err;
  }
};
// Add raw method that returns full axios response
index.auth.logout.raw =
  async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/auth/logout',
      'GET');
    return await axiosClient.request(axiosConfig);
};
// Change current password
index.auth.changePassword = async (request = {}) => {
  const axiosConfig =
    buildAxiosConfig(request, '/auth/change-password', 'POST');
  try {
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response)
    };
  } catch (err) {
    // Debug: log the error structure
    console.log('API Client Error:', {
      hasResponse: !!err.response,
      hasRequest: !!err.request,
      status: err.response?.status,
      message: err.message,
      errorKeys: Object.keys(err)
    });
    // Handle axios errors (4xx, 5xx status codes)
    if (err.response) {
      return {
        statusCode: err.response.status,
        headers: err.response.headers || {},
        body: err.response.data,
        data: err.response.data // Use raw error response data instead of extractData
      };
    }
    // Handle request errors (no response received)
    if (err.request) {
      return {
        statusCode: 0,
        headers: {},
        body: null,
        data: { error: 'No response received from server' }
      };
    }
    // Re-throw other errors (network errors, etc.)
    throw err;
  }
};
// Add raw method that returns full axios response
index.auth.changePassword.raw =
  async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/auth/change-password',
      'POST');
    return await axiosClient.request(axiosConfig);
};
// Request password reset
index.auth.forgotPassword = async (request = {}) => {
  const axiosConfig =
    buildAxiosConfig(request, '/auth/forgot-password', 'POST');
  try {
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response)
    };
  } catch (err) {
    // Debug: log the error structure
    console.log('API Client Error:', {
      hasResponse: !!err.response,
      hasRequest: !!err.request,
      status: err.response?.status,
      message: err.message,
      errorKeys: Object.keys(err)
    });
    // Handle axios errors (4xx, 5xx status codes)
    if (err.response) {
      return {
        statusCode: err.response.status,
        headers: err.response.headers || {},
        body: err.response.data,
        data: err.response.data // Use raw error response data instead of extractData
      };
    }
    // Handle request errors (no response received)
    if (err.request) {
      return {
        statusCode: 0,
        headers: {},
        body: null,
        data: { error: 'No response received from server' }
      };
    }
    // Re-throw other errors (network errors, etc.)
    throw err;
  }
};
// Add raw method that returns full axios response
index.auth.forgotPassword.raw =
  async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/auth/forgot-password',
      'POST');
    return await axiosClient.request(axiosConfig);
};
// Reset password with token
index.auth.resetPassword = async (request = {}) => {
  const axiosConfig =
    buildAxiosConfig(request, '/auth/reset-password', 'POST');
  try {
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response)
    };
  } catch (err) {
    // Debug: log the error structure
    console.log('API Client Error:', {
      hasResponse: !!err.response,
      hasRequest: !!err.request,
      status: err.response?.status,
      message: err.message,
      errorKeys: Object.keys(err)
    });
    // Handle axios errors (4xx, 5xx status codes)
    if (err.response) {
      return {
        statusCode: err.response.status,
        headers: err.response.headers || {},
        body: err.response.data,
        data: err.response.data // Use raw error response data instead of extractData
      };
    }
    // Handle request errors (no response received)
    if (err.request) {
      return {
        statusCode: 0,
        headers: {},
        body: null,
        data: { error: 'No response received from server' }
      };
    }
    // Re-throw other errors (network errors, etc.)
    throw err;
  }
};
// Add raw method that returns full axios response
index.auth.resetPassword.raw =
  async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/auth/reset-password',
      'POST');
    return await axiosClient.request(axiosConfig);
};
// Validate reset token
index.auth.validateResetToken = async (request = {}) => {
  const axiosConfig =
    buildAxiosConfig(request, '/auth/reset-password/token-status', 'POST');
  try {
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response)
    };
  } catch (err) {
    // Debug: log the error structure
    console.log('API Client Error:', {
      hasResponse: !!err.response,
      hasRequest: !!err.request,
      status: err.response?.status,
      message: err.message,
      errorKeys: Object.keys(err)
    });
    // Handle axios errors (4xx, 5xx status codes)
    if (err.response) {
      return {
        statusCode: err.response.status,
        headers: err.response.headers || {},
        body: err.response.data,
        data: err.response.data // Use raw error response data instead of extractData
      };
    }
    // Handle request errors (no response received)
    if (err.request) {
      return {
        statusCode: 0,
        headers: {},
        body: null,
        data: { error: 'No response received from server' }
      };
    }
    // Re-throw other errors (network errors, etc.)
    throw err;
  }
};
// Add raw method that returns full axios response
index.auth.validateResetToken.raw =
  async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/auth/reset-password/token-status',
      'POST');
    return await axiosClient.request(axiosConfig);
};
// List OAuth clients for integration (Admin only)
index.integrationOAuthClients.list = async (request = {}) => {
  const axiosConfig =
    buildAxiosConfig(request, '/integrations/{id}/clients', 'GET');
  try {
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response)
    };
  } catch (err) {
    // Debug: log the error structure
    console.log('API Client Error:', {
      hasResponse: !!err.response,
      hasRequest: !!err.request,
      status: err.response?.status,
      message: err.message,
      errorKeys: Object.keys(err)
    });
    // Handle axios errors (4xx, 5xx status codes)
    if (err.response) {
      return {
        statusCode: err.response.status,
        headers: err.response.headers || {},
        body: err.response.data,
        data: err.response.data // Use raw error response data instead of extractData
      };
    }
    // Handle request errors (no response received)
    if (err.request) {
      return {
        statusCode: 0,
        headers: {},
        body: null,
        data: { error: 'No response received from server' }
      };
    }
    // Re-throw other errors (network errors, etc.)
    throw err;
  }
};
// Add raw method that returns full axios response
index.integrationOAuthClients.list.raw =
  async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/integrations/{id}/clients',
      'GET');
    return await axiosClient.request(axiosConfig);
};
// Create OAuth client for integration (Admin only)
index.integrationOAuthClients.create = async (request = {}) => {
  const axiosConfig =
    buildAxiosConfig(request, '/integrations/{id}/clients', 'POST');
  try {
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response)
    };
  } catch (err) {
    // Debug: log the error structure
    console.log('API Client Error:', {
      hasResponse: !!err.response,
      hasRequest: !!err.request,
      status: err.response?.status,
      message: err.message,
      errorKeys: Object.keys(err)
    });
    // Handle axios errors (4xx, 5xx status codes)
    if (err.response) {
      return {
        statusCode: err.response.status,
        headers: err.response.headers || {},
        body: err.response.data,
        data: err.response.data // Use raw error response data instead of extractData
      };
    }
    // Handle request errors (no response received)
    if (err.request) {
      return {
        statusCode: 0,
        headers: {},
        body: null,
        data: { error: 'No response received from server' }
      };
    }
    // Re-throw other errors (network errors, etc.)
    throw err;
  }
};
// Add raw method that returns full axios response
index.integrationOAuthClients.create.raw =
  async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/integrations/{id}/clients',
      'POST');
    return await axiosClient.request(axiosConfig);
};
// Get integration OAuth client (Admin only)
index.integrationOAuthClients.findOne = async (request = {}) => {
  const axiosConfig =
    buildAxiosConfig(request, '/integrations/{id}/clients/{clientId}', 'GET');
  try {
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response)
    };
  } catch (err) {
    // Debug: log the error structure
    console.log('API Client Error:', {
      hasResponse: !!err.response,
      hasRequest: !!err.request,
      status: err.response?.status,
      message: err.message,
      errorKeys: Object.keys(err)
    });
    // Handle axios errors (4xx, 5xx status codes)
    if (err.response) {
      return {
        statusCode: err.response.status,
        headers: err.response.headers || {},
        body: err.response.data,
        data: err.response.data // Use raw error response data instead of extractData
      };
    }
    // Handle request errors (no response received)
    if (err.request) {
      return {
        statusCode: 0,
        headers: {},
        body: null,
        data: { error: 'No response received from server' }
      };
    }
    // Re-throw other errors (network errors, etc.)
    throw err;
  }
};
// Add raw method that returns full axios response
index.integrationOAuthClients.findOne.raw =
  async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/integrations/{id}/clients/{clientId}',
      'GET');
    return await axiosClient.request(axiosConfig);
};
// Delete integration OAuth client (Admin only)
index.integrationOAuthClients.delete = async (request = {}) => {
  const axiosConfig =
    buildAxiosConfig(request, '/integrations/{id}/clients/{clientId}', 'DELETE');
  try {
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response)
    };
  } catch (err) {
    // Debug: log the error structure
    console.log('API Client Error:', {
      hasResponse: !!err.response,
      hasRequest: !!err.request,
      status: err.response?.status,
      message: err.message,
      errorKeys: Object.keys(err)
    });
    // Handle axios errors (4xx, 5xx status codes)
    if (err.response) {
      return {
        statusCode: err.response.status,
        headers: err.response.headers || {},
        body: err.response.data,
        data: err.response.data // Use raw error response data instead of extractData
      };
    }
    // Handle request errors (no response received)
    if (err.request) {
      return {
        statusCode: 0,
        headers: {},
        body: null,
        data: { error: 'No response received from server' }
      };
    }
    // Re-throw other errors (network errors, etc.)
    throw err;
  }
};
// Add raw method that returns full axios response
index.integrationOAuthClients.delete.raw =
  async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/integrations/{id}/clients/{clientId}',
      'DELETE');
    return await axiosClient.request(axiosConfig);
};
// Rotate integration OAuth client secret (Admin only)
index.integrationOAuthClients.rotateSecret = async (request = {}) => {
  const axiosConfig =
    buildAxiosConfig(request, '/integrations/{id}/clients/{clientId}/rotate-secret', 'POST');
  try {
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response)
    };
  } catch (err) {
    // Debug: log the error structure
    console.log('API Client Error:', {
      hasResponse: !!err.response,
      hasRequest: !!err.request,
      status: err.response?.status,
      message: err.message,
      errorKeys: Object.keys(err)
    });
    // Handle axios errors (4xx, 5xx status codes)
    if (err.response) {
      return {
        statusCode: err.response.status,
        headers: err.response.headers || {},
        body: err.response.data,
        data: err.response.data // Use raw error response data instead of extractData
      };
    }
    // Handle request errors (no response received)
    if (err.request) {
      return {
        statusCode: 0,
        headers: {},
        body: null,
        data: { error: 'No response received from server' }
      };
    }
    // Re-throw other errors (network errors, etc.)
    throw err;
  }
};
// Add raw method that returns full axios response
index.integrationOAuthClients.rotateSecret.raw =
  async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/integrations/{id}/clients/{clientId}/rotate-secret',
      'POST');
    return await axiosClient.request(axiosConfig);
};
// List integrations (Admin only)
index.integrations.list = async (request = {}) => {
  const axiosConfig =
    buildAxiosConfig(request, '/integrations', 'GET');
  try {
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response)
    };
  } catch (err) {
    // Debug: log the error structure
    console.log('API Client Error:', {
      hasResponse: !!err.response,
      hasRequest: !!err.request,
      status: err.response?.status,
      message: err.message,
      errorKeys: Object.keys(err)
    });
    // Handle axios errors (4xx, 5xx status codes)
    if (err.response) {
      return {
        statusCode: err.response.status,
        headers: err.response.headers || {},
        body: err.response.data,
        data: err.response.data // Use raw error response data instead of extractData
      };
    }
    // Handle request errors (no response received)
    if (err.request) {
      return {
        statusCode: 0,
        headers: {},
        body: null,
        data: { error: 'No response received from server' }
      };
    }
    // Re-throw other errors (network errors, etc.)
    throw err;
  }
};
// Add raw method that returns full axios response
index.integrations.list.raw =
  async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/integrations',
      'GET');
    return await axiosClient.request(axiosConfig);
};
// Create integration (Admin only)
index.integrations.create = async (request = {}) => {
  const axiosConfig =
    buildAxiosConfig(request, '/integrations', 'POST');
  try {
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response)
    };
  } catch (err) {
    // Debug: log the error structure
    console.log('API Client Error:', {
      hasResponse: !!err.response,
      hasRequest: !!err.request,
      status: err.response?.status,
      message: err.message,
      errorKeys: Object.keys(err)
    });
    // Handle axios errors (4xx, 5xx status codes)
    if (err.response) {
      return {
        statusCode: err.response.status,
        headers: err.response.headers || {},
        body: err.response.data,
        data: err.response.data // Use raw error response data instead of extractData
      };
    }
    // Handle request errors (no response received)
    if (err.request) {
      return {
        statusCode: 0,
        headers: {},
        body: null,
        data: { error: 'No response received from server' }
      };
    }
    // Re-throw other errors (network errors, etc.)
    throw err;
  }
};
// Add raw method that returns full axios response
index.integrations.create.raw =
  async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/integrations',
      'POST');
    return await axiosClient.request(axiosConfig);
};
// Get integration by ID (Admin only)
index.integrations.findOne = async (request = {}) => {
  const axiosConfig =
    buildAxiosConfig(request, '/integrations/{id}', 'GET');
  try {
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response)
    };
  } catch (err) {
    // Debug: log the error structure
    console.log('API Client Error:', {
      hasResponse: !!err.response,
      hasRequest: !!err.request,
      status: err.response?.status,
      message: err.message,
      errorKeys: Object.keys(err)
    });
    // Handle axios errors (4xx, 5xx status codes)
    if (err.response) {
      return {
        statusCode: err.response.status,
        headers: err.response.headers || {},
        body: err.response.data,
        data: err.response.data // Use raw error response data instead of extractData
      };
    }
    // Handle request errors (no response received)
    if (err.request) {
      return {
        statusCode: 0,
        headers: {},
        body: null,
        data: { error: 'No response received from server' }
      };
    }
    // Re-throw other errors (network errors, etc.)
    throw err;
  }
};
// Add raw method that returns full axios response
index.integrations.findOne.raw =
  async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/integrations/{id}',
      'GET');
    return await axiosClient.request(axiosConfig);
};
// Update integration (Admin only)
index.integrations.update = async (request = {}) => {
  const axiosConfig =
    buildAxiosConfig(request, '/integrations/{id}', 'PATCH');
  try {
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response)
    };
  } catch (err) {
    // Debug: log the error structure
    console.log('API Client Error:', {
      hasResponse: !!err.response,
      hasRequest: !!err.request,
      status: err.response?.status,
      message: err.message,
      errorKeys: Object.keys(err)
    });
    // Handle axios errors (4xx, 5xx status codes)
    if (err.response) {
      return {
        statusCode: err.response.status,
        headers: err.response.headers || {},
        body: err.response.data,
        data: err.response.data // Use raw error response data instead of extractData
      };
    }
    // Handle request errors (no response received)
    if (err.request) {
      return {
        statusCode: 0,
        headers: {},
        body: null,
        data: { error: 'No response received from server' }
      };
    }
    // Re-throw other errors (network errors, etc.)
    throw err;
  }
};
// Add raw method that returns full axios response
index.integrations.update.raw =
  async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/integrations/{id}',
      'PATCH');
    return await axiosClient.request(axiosConfig);
};
// Delete integration (Admin only)
index.integrations.delete = async (request = {}) => {
  const axiosConfig =
    buildAxiosConfig(request, '/integrations/{id}', 'DELETE');
  try {
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response)
    };
  } catch (err) {
    // Debug: log the error structure
    console.log('API Client Error:', {
      hasResponse: !!err.response,
      hasRequest: !!err.request,
      status: err.response?.status,
      message: err.message,
      errorKeys: Object.keys(err)
    });
    // Handle axios errors (4xx, 5xx status codes)
    if (err.response) {
      return {
        statusCode: err.response.status,
        headers: err.response.headers || {},
        body: err.response.data,
        data: err.response.data // Use raw error response data instead of extractData
      };
    }
    // Handle request errors (no response received)
    if (err.request) {
      return {
        statusCode: 0,
        headers: {},
        body: null,
        data: { error: 'No response received from server' }
      };
    }
    // Re-throw other errors (network errors, etc.)
    throw err;
  }
};
// Add raw method that returns full axios response
index.integrations.delete.raw =
  async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/integrations/{id}',
      'DELETE');
    return await axiosClient.request(axiosConfig);
};
// Restore soft-deleted integration (Admin only)
index.integrations.restore = async (request = {}) => {
  const axiosConfig =
    buildAxiosConfig(request, '/integrations/{id}/restore', 'POST');
  try {
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response)
    };
  } catch (err) {
    // Debug: log the error structure
    console.log('API Client Error:', {
      hasResponse: !!err.response,
      hasRequest: !!err.request,
      status: err.response?.status,
      message: err.message,
      errorKeys: Object.keys(err)
    });
    // Handle axios errors (4xx, 5xx status codes)
    if (err.response) {
      return {
        statusCode: err.response.status,
        headers: err.response.headers || {},
        body: err.response.data,
        data: err.response.data // Use raw error response data instead of extractData
      };
    }
    // Handle request errors (no response received)
    if (err.request) {
      return {
        statusCode: 0,
        headers: {},
        body: null,
        data: { error: 'No response received from server' }
      };
    }
    // Re-throw other errors (network errors, etc.)
    throw err;
  }
};
// Add raw method that returns full axios response
index.integrations.restore.raw =
  async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/integrations/{id}/restore',
      'POST');
    return await axiosClient.request(axiosConfig);
};
// Initiate Google OAuth flow or logout
index.oidc.handleOidc = async (request = {}) => {
  const axiosConfig =
    buildAxiosConfig(request, '/oidc', 'GET');
  try {
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response)
    };
  } catch (err) {
    // Debug: log the error structure
    console.log('API Client Error:', {
      hasResponse: !!err.response,
      hasRequest: !!err.request,
      status: err.response?.status,
      message: err.message,
      errorKeys: Object.keys(err)
    });
    // Handle axios errors (4xx, 5xx status codes)
    if (err.response) {
      return {
        statusCode: err.response.status,
        headers: err.response.headers || {},
        body: err.response.data,
        data: err.response.data // Use raw error response data instead of extractData
      };
    }
    // Handle request errors (no response received)
    if (err.request) {
      return {
        statusCode: 0,
        headers: {},
        body: null,
        data: { error: 'No response received from server' }
      };
    }
    // Re-throw other errors (network errors, etc.)
    throw err;
  }
};
// Add raw method that returns full axios response
index.oidc.handleOidc.raw =
  async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/oidc',
      'GET');
    return await axiosClient.request(axiosConfig);
};
// Google OAuth callback
index.oidc.googleAuthCallback = async (request = {}) => {
  const axiosConfig =
    buildAxiosConfig(request, '/oidc/callback', 'GET');
  try {
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response)
    };
  } catch (err) {
    // Debug: log the error structure
    console.log('API Client Error:', {
      hasResponse: !!err.response,
      hasRequest: !!err.request,
      status: err.response?.status,
      message: err.message,
      errorKeys: Object.keys(err)
    });
    // Handle axios errors (4xx, 5xx status codes)
    if (err.response) {
      return {
        statusCode: err.response.status,
        headers: err.response.headers || {},
        body: err.response.data,
        data: err.response.data // Use raw error response data instead of extractData
      };
    }
    // Handle request errors (no response received)
    if (err.request) {
      return {
        statusCode: 0,
        headers: {},
        body: null,
        data: { error: 'No response received from server' }
      };
    }
    // Re-throw other errors (network errors, etc.)
    throw err;
  }
};
// Add raw method that returns full axios response
index.oidc.googleAuthCallback.raw =
  async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/oidc/callback',
      'GET');
    return await axiosClient.request(axiosConfig);
};
// OAuth 2.0 Token Endpoint (Client Credentials Flow)
index.oAuthToken.token = async (request = {}) => {
  const axiosConfig =
    buildAxiosConfig(request, '/oauth/token', 'POST');
  try {
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response)
    };
  } catch (err) {
    // Debug: log the error structure
    console.log('API Client Error:', {
      hasResponse: !!err.response,
      hasRequest: !!err.request,
      status: err.response?.status,
      message: err.message,
      errorKeys: Object.keys(err)
    });
    // Handle axios errors (4xx, 5xx status codes)
    if (err.response) {
      return {
        statusCode: err.response.status,
        headers: err.response.headers || {},
        body: err.response.data,
        data: err.response.data // Use raw error response data instead of extractData
      };
    }
    // Handle request errors (no response received)
    if (err.request) {
      return {
        statusCode: 0,
        headers: {},
        body: null,
        data: { error: 'No response received from server' }
      };
    }
    // Re-throw other errors (network errors, etc.)
    throw err;
  }
};
// Add raw method that returns full axios response
index.oAuthToken.token.raw =
  async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/oauth/token',
      'POST');
    return await axiosClient.request(axiosConfig);
};
// Get current user profile
index.currentUser.get = async (request = {}) => {
  const axiosConfig =
    buildAxiosConfig(request, '/me', 'GET');
  try {
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response)
    };
  } catch (err) {
    // Debug: log the error structure
    console.log('API Client Error:', {
      hasResponse: !!err.response,
      hasRequest: !!err.request,
      status: err.response?.status,
      message: err.message,
      errorKeys: Object.keys(err)
    });
    // Handle axios errors (4xx, 5xx status codes)
    if (err.response) {
      return {
        statusCode: err.response.status,
        headers: err.response.headers || {},
        body: err.response.data,
        data: err.response.data // Use raw error response data instead of extractData
      };
    }
    // Handle request errors (no response received)
    if (err.request) {
      return {
        statusCode: 0,
        headers: {},
        body: null,
        data: { error: 'No response received from server' }
      };
    }
    // Re-throw other errors (network errors, etc.)
    throw err;
  }
};
// Add raw method that returns full axios response
index.currentUser.get.raw =
  async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/me',
      'GET');
    return await axiosClient.request(axiosConfig);
};
// Update user profile
index.currentUser.update = async (request = {}) => {
  const axiosConfig =
    buildAxiosConfig(request, '/me', 'PATCH');
  try {
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response)
    };
  } catch (err) {
    // Debug: log the error structure
    console.log('API Client Error:', {
      hasResponse: !!err.response,
      hasRequest: !!err.request,
      status: err.response?.status,
      message: err.message,
      errorKeys: Object.keys(err)
    });
    // Handle axios errors (4xx, 5xx status codes)
    if (err.response) {
      return {
        statusCode: err.response.status,
        headers: err.response.headers || {},
        body: err.response.data,
        data: err.response.data // Use raw error response data instead of extractData
      };
    }
    // Handle request errors (no response received)
    if (err.request) {
      return {
        statusCode: 0,
        headers: {},
        body: null,
        data: { error: 'No response received from server' }
      };
    }
    // Re-throw other errors (network errors, etc.)
    throw err;
  }
};
// Add raw method that returns full axios response
index.currentUser.update.raw =
  async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/me',
      'PATCH');
    return await axiosClient.request(axiosConfig);
};
// List users
index.user.fetch = async (request = {}) => {
  const axiosConfig =
    buildAxiosConfig(request, '/users', 'GET');
  try {
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response)
    };
  } catch (err) {
    // Debug: log the error structure
    console.log('API Client Error:', {
      hasResponse: !!err.response,
      hasRequest: !!err.request,
      status: err.response?.status,
      message: err.message,
      errorKeys: Object.keys(err)
    });
    // Handle axios errors (4xx, 5xx status codes)
    if (err.response) {
      return {
        statusCode: err.response.status,
        headers: err.response.headers || {},
        body: err.response.data,
        data: err.response.data // Use raw error response data instead of extractData
      };
    }
    // Handle request errors (no response received)
    if (err.request) {
      return {
        statusCode: 0,
        headers: {},
        body: null,
        data: { error: 'No response received from server' }
      };
    }
    // Re-throw other errors (network errors, etc.)
    throw err;
  }
};
// Add raw method that returns full axios response
index.user.fetch.raw =
  async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/users',
      'GET');
    return await axiosClient.request(axiosConfig);
};
// Create or invite user (Admin only)
index.user.create = async (request = {}) => {
  const axiosConfig =
    buildAxiosConfig(request, '/users', 'POST');
  try {
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response)
    };
  } catch (err) {
    // Debug: log the error structure
    console.log('API Client Error:', {
      hasResponse: !!err.response,
      hasRequest: !!err.request,
      status: err.response?.status,
      message: err.message,
      errorKeys: Object.keys(err)
    });
    // Handle axios errors (4xx, 5xx status codes)
    if (err.response) {
      return {
        statusCode: err.response.status,
        headers: err.response.headers || {},
        body: err.response.data,
        data: err.response.data // Use raw error response data instead of extractData
      };
    }
    // Handle request errors (no response received)
    if (err.request) {
      return {
        statusCode: 0,
        headers: {},
        body: null,
        data: { error: 'No response received from server' }
      };
    }
    // Re-throw other errors (network errors, etc.)
    throw err;
  }
};
// Add raw method that returns full axios response
index.user.create.raw =
  async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/users',
      'POST');
    return await axiosClient.request(axiosConfig);
};
// Get user by ID (Admin only)
index.user.get = async (request = {}) => {
  const axiosConfig =
    buildAxiosConfig(request, '/users/{id}', 'GET');
  try {
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response)
    };
  } catch (err) {
    // Debug: log the error structure
    console.log('API Client Error:', {
      hasResponse: !!err.response,
      hasRequest: !!err.request,
      status: err.response?.status,
      message: err.message,
      errorKeys: Object.keys(err)
    });
    // Handle axios errors (4xx, 5xx status codes)
    if (err.response) {
      return {
        statusCode: err.response.status,
        headers: err.response.headers || {},
        body: err.response.data,
        data: err.response.data // Use raw error response data instead of extractData
      };
    }
    // Handle request errors (no response received)
    if (err.request) {
      return {
        statusCode: 0,
        headers: {},
        body: null,
        data: { error: 'No response received from server' }
      };
    }
    // Re-throw other errors (network errors, etc.)
    throw err;
  }
};
// Add raw method that returns full axios response
index.user.get.raw =
  async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/users/{id}',
      'GET');
    return await axiosClient.request(axiosConfig);
};
// Update user by ID
index.user.update = async (request = {}) => {
  const axiosConfig =
    buildAxiosConfig(request, '/users/{id}', 'PATCH');
  try {
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response)
    };
  } catch (err) {
    // Debug: log the error structure
    console.log('API Client Error:', {
      hasResponse: !!err.response,
      hasRequest: !!err.request,
      status: err.response?.status,
      message: err.message,
      errorKeys: Object.keys(err)
    });
    // Handle axios errors (4xx, 5xx status codes)
    if (err.response) {
      return {
        statusCode: err.response.status,
        headers: err.response.headers || {},
        body: err.response.data,
        data: err.response.data // Use raw error response data instead of extractData
      };
    }
    // Handle request errors (no response received)
    if (err.request) {
      return {
        statusCode: 0,
        headers: {},
        body: null,
        data: { error: 'No response received from server' }
      };
    }
    // Re-throw other errors (network errors, etc.)
    throw err;
  }
};
// Add raw method that returns full axios response
index.user.update.raw =
  async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/users/{id}',
      'PATCH');
    return await axiosClient.request(axiosConfig);
};
// Delete user (Admin only)
index.user.remove = async (request = {}) => {
  const axiosConfig =
    buildAxiosConfig(request, '/users/{id}', 'DELETE');
  try {
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response)
    };
  } catch (err) {
    // Debug: log the error structure
    console.log('API Client Error:', {
      hasResponse: !!err.response,
      hasRequest: !!err.request,
      status: err.response?.status,
      message: err.message,
      errorKeys: Object.keys(err)
    });
    // Handle axios errors (4xx, 5xx status codes)
    if (err.response) {
      return {
        statusCode: err.response.status,
        headers: err.response.headers || {},
        body: err.response.data,
        data: err.response.data // Use raw error response data instead of extractData
      };
    }
    // Handle request errors (no response received)
    if (err.request) {
      return {
        statusCode: 0,
        headers: {},
        body: null,
        data: { error: 'No response received from server' }
      };
    }
    // Re-throw other errors (network errors, etc.)
    throw err;
  }
};
// Add raw method that returns full axios response
index.user.remove.raw =
  async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/users/{id}',
      'DELETE');
    return await axiosClient.request(axiosConfig);
};
// Restore soft-deleted user (Admin only)
index.user.restore = async (request = {}) => {
  const axiosConfig =
    buildAxiosConfig(request, '/users/{id}/restore', 'POST');
  try {
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response)
    };
  } catch (err) {
    // Debug: log the error structure
    console.log('API Client Error:', {
      hasResponse: !!err.response,
      hasRequest: !!err.request,
      status: err.response?.status,
      message: err.message,
      errorKeys: Object.keys(err)
    });
    // Handle axios errors (4xx, 5xx status codes)
    if (err.response) {
      return {
        statusCode: err.response.status,
        headers: err.response.headers || {},
        body: err.response.data,
        data: err.response.data // Use raw error response data instead of extractData
      };
    }
    // Handle request errors (no response received)
    if (err.request) {
      return {
        statusCode: 0,
        headers: {},
        body: null,
        data: { error: 'No response received from server' }
      };
    }
    // Re-throw other errors (network errors, etc.)
    throw err;
  }
};
// Add raw method that returns full axios response
index.user.restore.raw =
  async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/users/{id}/restore',
      'POST');
    return await axiosClient.request(axiosConfig);
};
// Reinvite user (Admin only)
index.user.reinvite = async (request = {}) => {
  const axiosConfig =
    buildAxiosConfig(request, '/users/{id}/reinvite', 'POST');
  try {
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response)
    };
  } catch (err) {
    // Debug: log the error structure
    console.log('API Client Error:', {
      hasResponse: !!err.response,
      hasRequest: !!err.request,
      status: err.response?.status,
      message: err.message,
      errorKeys: Object.keys(err)
    });
    // Handle axios errors (4xx, 5xx status codes)
    if (err.response) {
      return {
        statusCode: err.response.status,
        headers: err.response.headers || {},
        body: err.response.data,
        data: err.response.data // Use raw error response data instead of extractData
      };
    }
    // Handle request errors (no response received)
    if (err.request) {
      return {
        statusCode: 0,
        headers: {},
        body: null,
        data: { error: 'No response received from server' }
      };
    }
    // Re-throw other errors (network errors, etc.)
    throw err;
  }
};
// Add raw method that returns full axios response
index.user.reinvite.raw =
  async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/users/{id}/reinvite',
      'POST');
    return await axiosClient.request(axiosConfig);
};
// Basic health check
index.health.healthCheck = async (request = {}) => {
  const axiosConfig =
    buildAxiosConfig(request, '/healthcheck', 'GET');
  try {
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response)
    };
  } catch (err) {
    // Debug: log the error structure
    console.log('API Client Error:', {
      hasResponse: !!err.response,
      hasRequest: !!err.request,
      status: err.response?.status,
      message: err.message,
      errorKeys: Object.keys(err)
    });
    // Handle axios errors (4xx, 5xx status codes)
    if (err.response) {
      return {
        statusCode: err.response.status,
        headers: err.response.headers || {},
        body: err.response.data,
        data: err.response.data // Use raw error response data instead of extractData
      };
    }
    // Handle request errors (no response received)
    if (err.request) {
      return {
        statusCode: 0,
        headers: {},
        body: null,
        data: { error: 'No response received from server' }
      };
    }
    // Re-throw other errors (network errors, etc.)
    throw err;
  }
};
// Add raw method that returns full axios response
index.health.healthCheck.raw =
  async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/healthcheck',
      'GET');
    return await axiosClient.request(axiosConfig);
};
// Liveness probe
index.health.liveness = async (request = {}) => {
  const axiosConfig =
    buildAxiosConfig(request, '/health/live', 'GET');
  try {
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response)
    };
  } catch (err) {
    // Debug: log the error structure
    console.log('API Client Error:', {
      hasResponse: !!err.response,
      hasRequest: !!err.request,
      status: err.response?.status,
      message: err.message,
      errorKeys: Object.keys(err)
    });
    // Handle axios errors (4xx, 5xx status codes)
    if (err.response) {
      return {
        statusCode: err.response.status,
        headers: err.response.headers || {},
        body: err.response.data,
        data: err.response.data // Use raw error response data instead of extractData
      };
    }
    // Handle request errors (no response received)
    if (err.request) {
      return {
        statusCode: 0,
        headers: {},
        body: null,
        data: { error: 'No response received from server' }
      };
    }
    // Re-throw other errors (network errors, etc.)
    throw err;
  }
};
// Add raw method that returns full axios response
index.health.liveness.raw =
  async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/health/live',
      'GET');
    return await axiosClient.request(axiosConfig);
};
// Readiness probe
index.health.readiness = async (request = {}) => {
  const axiosConfig =
    buildAxiosConfig(request, '/health/ready', 'GET');
  try {
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response)
    };
  } catch (err) {
    // Debug: log the error structure
    console.log('API Client Error:', {
      hasResponse: !!err.response,
      hasRequest: !!err.request,
      status: err.response?.status,
      message: err.message,
      errorKeys: Object.keys(err)
    });
    // Handle axios errors (4xx, 5xx status codes)
    if (err.response) {
      return {
        statusCode: err.response.status,
        headers: err.response.headers || {},
        body: err.response.data,
        data: err.response.data // Use raw error response data instead of extractData
      };
    }
    // Handle request errors (no response received)
    if (err.request) {
      return {
        statusCode: 0,
        headers: {},
        body: null,
        data: { error: 'No response received from server' }
      };
    }
    // Re-throw other errors (network errors, etc.)
    throw err;
  }
};
// Add raw method that returns full axios response
index.health.readiness.raw =
  async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/health/ready',
      'GET');
    return await axiosClient.request(axiosConfig);
};
// Test Sentry error capture (development only)
index.health.sentryDebug = async (request = {}) => {
  const axiosConfig =
    buildAxiosConfig(request, '/sentry/debug', 'GET');
  try {
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response)
    };
  } catch (err) {
    // Debug: log the error structure
    console.log('API Client Error:', {
      hasResponse: !!err.response,
      hasRequest: !!err.request,
      status: err.response?.status,
      message: err.message,
      errorKeys: Object.keys(err)
    });
    // Handle axios errors (4xx, 5xx status codes)
    if (err.response) {
      return {
        statusCode: err.response.status,
        headers: err.response.headers || {},
        body: err.response.data,
        data: err.response.data // Use raw error response data instead of extractData
      };
    }
    // Handle request errors (no response received)
    if (err.request) {
      return {
        statusCode: 0,
        headers: {},
        body: null,
        data: { error: 'No response received from server' }
      };
    }
    // Re-throw other errors (network errors, etc.)
    throw err;
  }
};
// Add raw method that returns full axios response
index.health.sentryDebug.raw =
  async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/sentry/debug',
      'GET');
    return await axiosClient.request(axiosConfig);
};
// Test Sentry message capture (development only)
index.health.sentryMessage = async (request = {}) => {
  const axiosConfig =
    buildAxiosConfig(request, '/sentry/message', 'GET');
  try {
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response)
    };
  } catch (err) {
    // Debug: log the error structure
    console.log('API Client Error:', {
      hasResponse: !!err.response,
      hasRequest: !!err.request,
      status: err.response?.status,
      message: err.message,
      errorKeys: Object.keys(err)
    });
    // Handle axios errors (4xx, 5xx status codes)
    if (err.response) {
      return {
        statusCode: err.response.status,
        headers: err.response.headers || {},
        body: err.response.data,
        data: err.response.data // Use raw error response data instead of extractData
      };
    }
    // Handle request errors (no response received)
    if (err.request) {
      return {
        statusCode: 0,
        headers: {},
        body: null,
        data: { error: 'No response received from server' }
      };
    }
    // Re-throw other errors (network errors, etc.)
    throw err;
  }
};
// Add raw method that returns full axios response
index.health.sentryMessage.raw =
  async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/sentry/message',
      'GET');
    return await axiosClient.request(axiosConfig);
};
// Fetch list of content packages (repositories)
index.content.list = async (request = {}) => {
  const axiosConfig =
    buildAxiosConfig(request, '/content', 'GET');
  try {
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response)
    };
  } catch (err) {
    // Debug: log the error structure
    console.log('API Client Error:', {
      hasResponse: !!err.response,
      hasRequest: !!err.request,
      status: err.response?.status,
      message: err.message,
      errorKeys: Object.keys(err)
    });
    // Handle axios errors (4xx, 5xx status codes)
    if (err.response) {
      return {
        statusCode: err.response.status,
        headers: err.response.headers || {},
        body: err.response.data,
        data: err.response.data // Use raw error response data instead of extractData
      };
    }
    // Handle request errors (no response received)
    if (err.request) {
      return {
        statusCode: 0,
        headers: {},
        body: null,
        data: { error: 'No response received from server' }
      };
    }
    // Re-throw other errors (network errors, etc.)
    throw err;
  }
};
// Add raw method that returns full axios response
index.content.list.raw =
  async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/content',
      'GET');
    return await axiosClient.request(axiosConfig);
};
// Get content package entity (repository) by id
index.content.getPackage = async (request = {}) => {
  const axiosConfig =
    buildAxiosConfig(request, '/content/{id}', 'GET');
  try {
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response)
    };
  } catch (err) {
    // Debug: log the error structure
    console.log('API Client Error:', {
      hasResponse: !!err.response,
      hasRequest: !!err.request,
      status: err.response?.status,
      message: err.message,
      errorKeys: Object.keys(err)
    });
    // Handle axios errors (4xx, 5xx status codes)
    if (err.response) {
      return {
        statusCode: err.response.status,
        headers: err.response.headers || {},
        body: err.response.data,
        data: err.response.data // Use raw error response data instead of extractData
      };
    }
    // Handle request errors (no response received)
    if (err.request) {
      return {
        statusCode: 0,
        headers: {},
        body: null,
        data: { error: 'No response received from server' }
      };
    }
    // Re-throw other errors (network errors, etc.)
    throw err;
  }
};
// Add raw method that returns full axios response
index.content.getPackage.raw =
  async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/content/{id}',
      'GET');
    return await axiosClient.request(axiosConfig);
};
// Get Tailor CMS repository access information (users and roles)
index.content.getRepositoryAccess = async (request = {}) => {
  const axiosConfig =
    buildAxiosConfig(request, '/content/{id}/access', 'GET');
  try {
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response)
    };
  } catch (err) {
    // Debug: log the error structure
    console.log('API Client Error:', {
      hasResponse: !!err.response,
      hasRequest: !!err.request,
      status: err.response?.status,
      message: err.message,
      errorKeys: Object.keys(err)
    });
    // Handle axios errors (4xx, 5xx status codes)
    if (err.response) {
      return {
        statusCode: err.response.status,
        headers: err.response.headers || {},
        body: err.response.data,
        data: err.response.data // Use raw error response data instead of extractData
      };
    }
    // Handle request errors (no response received)
    if (err.request) {
      return {
        statusCode: 0,
        headers: {},
        body: null,
        data: { error: 'No response received from server' }
      };
    }
    // Re-throw other errors (network errors, etc.)
    throw err;
  }
};
// Add raw method that returns full axios response
index.content.getRepositoryAccess.raw =
  async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/content/{id}/access',
      'GET');
    return await axiosClient.request(axiosConfig);
};
// Get specific content node by id
index.content.getNode = async (request = {}) => {
  const axiosConfig =
    buildAxiosConfig(request, '/content/node/{id}', 'GET');
  try {
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response)
    };
  } catch (err) {
    // Debug: log the error structure
    console.log('API Client Error:', {
      hasResponse: !!err.response,
      hasRequest: !!err.request,
      status: err.response?.status,
      message: err.message,
      errorKeys: Object.keys(err)
    });
    // Handle axios errors (4xx, 5xx status codes)
    if (err.response) {
      return {
        statusCode: err.response.status,
        headers: err.response.headers || {},
        body: err.response.data,
        data: err.response.data // Use raw error response data instead of extractData
      };
    }
    // Handle request errors (no response received)
    if (err.request) {
      return {
        statusCode: 0,
        headers: {},
        body: null,
        data: { error: 'No response received from server' }
      };
    }
    // Re-throw other errors (network errors, etc.)
    throw err;
  }
};
// Add raw method that returns full axios response
index.content.getNode.raw =
  async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/content/node/{id}',
      'GET');
    return await axiosClient.request(axiosConfig);
};
// Filter activities across all repositories
index.content.filterActivities = async (request = {}) => {
  const axiosConfig =
    buildAxiosConfig(request, '/content/activities', 'GET');
  try {
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response)
    };
  } catch (err) {
    // Debug: log the error structure
    console.log('API Client Error:', {
      hasResponse: !!err.response,
      hasRequest: !!err.request,
      status: err.response?.status,
      message: err.message,
      errorKeys: Object.keys(err)
    });
    // Handle axios errors (4xx, 5xx status codes)
    if (err.response) {
      return {
        statusCode: err.response.status,
        headers: err.response.headers || {},
        body: err.response.data,
        data: err.response.data // Use raw error response data instead of extractData
      };
    }
    // Handle request errors (no response received)
    if (err.request) {
      return {
        statusCode: 0,
        headers: {},
        body: null,
        data: { error: 'No response received from server' }
      };
    }
    // Re-throw other errors (network errors, etc.)
    throw err;
  }
};
// Add raw method that returns full axios response
index.content.filterActivities.raw =
  async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/content/activities',
      'GET');
    return await axiosClient.request(axiosConfig);
};
// Filter content containers across all repositories
index.content.filterContainers = async (request = {}) => {
  const axiosConfig =
    buildAxiosConfig(request, '/content/containers', 'GET');
  try {
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response)
    };
  } catch (err) {
    // Debug: log the error structure
    console.log('API Client Error:', {
      hasResponse: !!err.response,
      hasRequest: !!err.request,
      status: err.response?.status,
      message: err.message,
      errorKeys: Object.keys(err)
    });
    // Handle axios errors (4xx, 5xx status codes)
    if (err.response) {
      return {
        statusCode: err.response.status,
        headers: err.response.headers || {},
        body: err.response.data,
        data: err.response.data // Use raw error response data instead of extractData
      };
    }
    // Handle request errors (no response received)
    if (err.request) {
      return {
        statusCode: 0,
        headers: {},
        body: null,
        data: { error: 'No response received from server' }
      };
    }
    // Re-throw other errors (network errors, etc.)
    throw err;
  }
};
// Add raw method that returns full axios response
index.content.filterContainers.raw =
  async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/content/containers',
      'GET');
    return await axiosClient.request(axiosConfig);
};
// Get all learning goals (problems and outcomes)
index.content.getLearningGoals = async (request = {}) => {
  const axiosConfig =
    buildAxiosConfig(request, '/content/goals', 'GET');
  try {
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response)
    };
  } catch (err) {
    // Debug: log the error structure
    console.log('API Client Error:', {
      hasResponse: !!err.response,
      hasRequest: !!err.request,
      status: err.response?.status,
      message: err.message,
      errorKeys: Object.keys(err)
    });
    // Handle axios errors (4xx, 5xx status codes)
    if (err.response) {
      return {
        statusCode: err.response.status,
        headers: err.response.headers || {},
        body: err.response.data,
        data: err.response.data // Use raw error response data instead of extractData
      };
    }
    // Handle request errors (no response received)
    if (err.request) {
      return {
        statusCode: 0,
        headers: {},
        body: null,
        data: { error: 'No response received from server' }
      };
    }
    // Re-throw other errors (network errors, etc.)
    throw err;
  }
};
// Add raw method that returns full axios response
index.content.getLearningGoals.raw =
  async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/content/goals',
      'GET');
    return await axiosClient.request(axiosConfig);
};
// Get content analysis and profiling questions
index.content.getAnalysis = async (request = {}) => {
  const axiosConfig =
    buildAxiosConfig(request, '/content/analysis', 'GET');
  try {
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response)
    };
  } catch (err) {
    // Debug: log the error structure
    console.log('API Client Error:', {
      hasResponse: !!err.response,
      hasRequest: !!err.request,
      status: err.response?.status,
      message: err.message,
      errorKeys: Object.keys(err)
    });
    // Handle axios errors (4xx, 5xx status codes)
    if (err.response) {
      return {
        statusCode: err.response.status,
        headers: err.response.headers || {},
        body: err.response.data,
        data: err.response.data // Use raw error response data instead of extractData
      };
    }
    // Handle request errors (no response received)
    if (err.request) {
      return {
        statusCode: 0,
        headers: {},
        body: null,
        data: { error: 'No response received from server' }
      };
    }
    // Re-throw other errors (network errors, etc.)
    throw err;
  }
};
// Add raw method that returns full axios response
index.content.getAnalysis.raw =
  async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/content/analysis',
      'GET');
    return await axiosClient.request(axiosConfig);
};
// Force regeneration of content analysis
index.content.forceAnalysis = async (request = {}) => {
  const axiosConfig =
    buildAxiosConfig(request, '/content/analysis', 'POST');
  try {
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response)
    };
  } catch (err) {
    // Debug: log the error structure
    console.log('API Client Error:', {
      hasResponse: !!err.response,
      hasRequest: !!err.request,
      status: err.response?.status,
      message: err.message,
      errorKeys: Object.keys(err)
    });
    // Handle axios errors (4xx, 5xx status codes)
    if (err.response) {
      return {
        statusCode: err.response.status,
        headers: err.response.headers || {},
        body: err.response.data,
        data: err.response.data // Use raw error response data instead of extractData
      };
    }
    // Handle request errors (no response received)
    if (err.request) {
      return {
        statusCode: 0,
        headers: {},
        body: null,
        data: { error: 'No response received from server' }
      };
    }
    // Re-throw other errors (network errors, etc.)
    throw err;
  }
};
// Add raw method that returns full axios response
index.content.forceAnalysis.raw =
  async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/content/analysis',
      'POST');
    return await axiosClient.request(axiosConfig);
};
// Get content statistics across all repositories
index.content.getStats = async (request = {}) => {
  const axiosConfig =
    buildAxiosConfig(request, '/content/stats', 'GET');
  try {
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response)
    };
  } catch (err) {
    // Debug: log the error structure
    console.log('API Client Error:', {
      hasResponse: !!err.response,
      hasRequest: !!err.request,
      status: err.response?.status,
      message: err.message,
      errorKeys: Object.keys(err)
    });
    // Handle axios errors (4xx, 5xx status codes)
    if (err.response) {
      return {
        statusCode: err.response.status,
        headers: err.response.headers || {},
        body: err.response.data,
        data: err.response.data // Use raw error response data instead of extractData
      };
    }
    // Handle request errors (no response received)
    if (err.request) {
      return {
        statusCode: 0,
        headers: {},
        body: null,
        data: { error: 'No response received from server' }
      };
    }
    // Re-throw other errors (network errors, etc.)
    throw err;
  }
};
// Add raw method that returns full axios response
index.content.getStats.raw =
  async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/content/stats',
      'GET');
    return await axiosClient.request(axiosConfig);
};
// Webhook endpoint for TailorCMS publish events (OAuth only)
index.webhooks.handlePublishWebhook = async (request = {}) => {
  const axiosConfig =
    buildAxiosConfig(request, '/content/webhook/publish', 'POST');
  try {
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response)
    };
  } catch (err) {
    // Debug: log the error structure
    console.log('API Client Error:', {
      hasResponse: !!err.response,
      hasRequest: !!err.request,
      status: err.response?.status,
      message: err.message,
      errorKeys: Object.keys(err)
    });
    // Handle axios errors (4xx, 5xx status codes)
    if (err.response) {
      return {
        statusCode: err.response.status,
        headers: err.response.headers || {},
        body: err.response.data,
        data: err.response.data // Use raw error response data instead of extractData
      };
    }
    // Handle request errors (no response received)
    if (err.request) {
      return {
        statusCode: 0,
        headers: {},
        body: null,
        data: { error: 'No response received from server' }
      };
    }
    // Re-throw other errors (network errors, etc.)
    throw err;
  }
};
// Add raw method that returns full axios response
index.webhooks.handlePublishWebhook.raw =
  async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/content/webhook/publish',
      'POST');
    return await axiosClient.request(axiosConfig);
};
// Endpoint for Tailor CMS access rights updates (OAuth only)
index.webhooks.handleAccessWebhook = async (request = {}) => {
  const axiosConfig =
    buildAxiosConfig(request, '/content/webhook/access', 'POST');
  try {
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response)
    };
  } catch (err) {
    // Debug: log the error structure
    console.log('API Client Error:', {
      hasResponse: !!err.response,
      hasRequest: !!err.request,
      status: err.response?.status,
      message: err.message,
      errorKeys: Object.keys(err)
    });
    // Handle axios errors (4xx, 5xx status codes)
    if (err.response) {
      return {
        statusCode: err.response.status,
        headers: err.response.headers || {},
        body: err.response.data,
        data: err.response.data // Use raw error response data instead of extractData
      };
    }
    // Handle request errors (no response received)
    if (err.request) {
      return {
        statusCode: 0,
        headers: {},
        body: null,
        data: { error: 'No response received from server' }
      };
    }
    // Re-throw other errors (network errors, etc.)
    throw err;
  }
};
// Add raw method that returns full axios response
index.webhooks.handleAccessWebhook.raw =
  async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/content/webhook/access',
      'POST');
    return await axiosClient.request(axiosConfig);
};
// Process learner interaction with the content element (Tailor CMS content element hook)
index.learning.interact = async (request = {}) => {
  const axiosConfig =
    buildAxiosConfig(request, '/learning/interaction', 'POST');
  try {
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response)
    };
  } catch (err) {
    // Debug: log the error structure
    console.log('API Client Error:', {
      hasResponse: !!err.response,
      hasRequest: !!err.request,
      status: err.response?.status,
      message: err.message,
      errorKeys: Object.keys(err)
    });
    // Handle axios errors (4xx, 5xx status codes)
    if (err.response) {
      return {
        statusCode: err.response.status,
        headers: err.response.headers || {},
        body: err.response.data,
        data: err.response.data // Use raw error response data instead of extractData
      };
    }
    // Handle request errors (no response received)
    if (err.request) {
      return {
        statusCode: 0,
        headers: {},
        body: null,
        data: { error: 'No response received from server' }
      };
    }
    // Re-throw other errors (network errors, etc.)
    throw err;
  }
};
// Add raw method that returns full axios response
index.learning.interact.raw =
  async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/learning/interaction',
      'POST');
    return await axiosClient.request(axiosConfig);
};
// Record content consumption activity
index.learning.recordActivity = async (request = {}) => {
  const axiosConfig =
    buildAxiosConfig(request, '/learning/activity', 'POST');
  try {
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response)
    };
  } catch (err) {
    // Debug: log the error structure
    console.log('API Client Error:', {
      hasResponse: !!err.response,
      hasRequest: !!err.request,
      status: err.response?.status,
      message: err.message,
      errorKeys: Object.keys(err)
    });
    // Handle axios errors (4xx, 5xx status codes)
    if (err.response) {
      return {
        statusCode: err.response.status,
        headers: err.response.headers || {},
        body: err.response.data,
        data: err.response.data // Use raw error response data instead of extractData
      };
    }
    // Handle request errors (no response received)
    if (err.request) {
      return {
        statusCode: 0,
        headers: {},
        body: null,
        data: { error: 'No response received from server' }
      };
    }
    // Re-throw other errors (network errors, etc.)
    throw err;
  }
};
// Add raw method that returns full axios response
index.learning.recordActivity.raw =
  async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/learning/activity',
      'POST');
    return await axiosClient.request(axiosConfig);
};
// Initialize learner profile with onboarding survey
index.learning.submitOnboarding = async (request = {}) => {
  const axiosConfig =
    buildAxiosConfig(request, '/learning/onboarding', 'POST');
  try {
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response)
    };
  } catch (err) {
    // Debug: log the error structure
    console.log('API Client Error:', {
      hasResponse: !!err.response,
      hasRequest: !!err.request,
      status: err.response?.status,
      message: err.message,
      errorKeys: Object.keys(err)
    });
    // Handle axios errors (4xx, 5xx status codes)
    if (err.response) {
      return {
        statusCode: err.response.status,
        headers: err.response.headers || {},
        body: err.response.data,
        data: err.response.data // Use raw error response data instead of extractData
      };
    }
    // Handle request errors (no response received)
    if (err.request) {
      return {
        statusCode: 0,
        headers: {},
        body: null,
        data: { error: 'No response received from server' }
      };
    }
    // Re-throw other errors (network errors, etc.)
    throw err;
  }
};
// Add raw method that returns full axios response
index.learning.submitOnboarding.raw =
  async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/learning/onboarding',
      'POST');
    return await axiosClient.request(axiosConfig);
};
// Get in-progress content
index.learning.getContinueLearning = async (request = {}) => {
  const axiosConfig =
    buildAxiosConfig(request, '/learning/continue', 'GET');
  try {
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response)
    };
  } catch (err) {
    // Debug: log the error structure
    console.log('API Client Error:', {
      hasResponse: !!err.response,
      hasRequest: !!err.request,
      status: err.response?.status,
      message: err.message,
      errorKeys: Object.keys(err)
    });
    // Handle axios errors (4xx, 5xx status codes)
    if (err.response) {
      return {
        statusCode: err.response.status,
        headers: err.response.headers || {},
        body: err.response.data,
        data: err.response.data // Use raw error response data instead of extractData
      };
    }
    // Handle request errors (no response received)
    if (err.request) {
      return {
        statusCode: 0,
        headers: {},
        body: null,
        data: { error: 'No response received from server' }
      };
    }
    // Re-throw other errors (network errors, etc.)
    throw err;
  }
};
// Add raw method that returns full axios response
index.learning.getContinueLearning.raw =
  async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/learning/continue',
      'GET');
    return await axiosClient.request(axiosConfig);
};
// Get personalized content recommendations
index.learning.getRecommendations = async (request = {}) => {
  const axiosConfig =
    buildAxiosConfig(request, '/learning/recommendations', 'GET');
  try {
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response)
    };
  } catch (err) {
    // Debug: log the error structure
    console.log('API Client Error:', {
      hasResponse: !!err.response,
      hasRequest: !!err.request,
      status: err.response?.status,
      message: err.message,
      errorKeys: Object.keys(err)
    });
    // Handle axios errors (4xx, 5xx status codes)
    if (err.response) {
      return {
        statusCode: err.response.status,
        headers: err.response.headers || {},
        body: err.response.data,
        data: err.response.data // Use raw error response data instead of extractData
      };
    }
    // Handle request errors (no response received)
    if (err.request) {
      return {
        statusCode: 0,
        headers: {},
        body: null,
        data: { error: 'No response received from server' }
      };
    }
    // Re-throw other errors (network errors, etc.)
    throw err;
  }
};
// Add raw method that returns full axios response
index.learning.getRecommendations.raw =
  async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/learning/recommendations',
      'GET');
    return await axiosClient.request(axiosConfig);
};
// Find similar content
index.learning.getMoreLikeThis = async (request = {}) => {
  const axiosConfig =
    buildAxiosConfig(request, '/learning/similar/{id}', 'GET');
  try {
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response)
    };
  } catch (err) {
    // Debug: log the error structure
    console.log('API Client Error:', {
      hasResponse: !!err.response,
      hasRequest: !!err.request,
      status: err.response?.status,
      message: err.message,
      errorKeys: Object.keys(err)
    });
    // Handle axios errors (4xx, 5xx status codes)
    if (err.response) {
      return {
        statusCode: err.response.status,
        headers: err.response.headers || {},
        body: err.response.data,
        data: err.response.data // Use raw error response data instead of extractData
      };
    }
    // Handle request errors (no response received)
    if (err.request) {
      return {
        statusCode: 0,
        headers: {},
        body: null,
        data: { error: 'No response received from server' }
      };
    }
    // Re-throw other errors (network errors, etc.)
    throw err;
  }
};
// Add raw method that returns full axios response
index.learning.getMoreLikeThis.raw =
  async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/learning/similar/{id}',
      'GET');
    return await axiosClient.request(axiosConfig);
};
// Reset user activity (admin)
index.learning.resetUserActivity = async (request = {}) => {
  const axiosConfig =
    buildAxiosConfig(request, '/learning/activity/{userId}', 'DELETE');
  try {
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response)
    };
  } catch (err) {
    // Debug: log the error structure
    console.log('API Client Error:', {
      hasResponse: !!err.response,
      hasRequest: !!err.request,
      status: err.response?.status,
      message: err.message,
      errorKeys: Object.keys(err)
    });
    // Handle axios errors (4xx, 5xx status codes)
    if (err.response) {
      return {
        statusCode: err.response.status,
        headers: err.response.headers || {},
        body: err.response.data,
        data: err.response.data // Use raw error response data instead of extractData
      };
    }
    // Handle request errors (no response received)
    if (err.request) {
      return {
        statusCode: 0,
        headers: {},
        body: null,
        data: { error: 'No response received from server' }
      };
    }
    // Re-throw other errors (network errors, etc.)
    throw err;
  }
};
// Add raw method that returns full axios response
index.learning.resetUserActivity.raw =
  async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/learning/activity/{userId}',
      'DELETE');
    return await axiosClient.request(axiosConfig);
};
// Generate AI text for scenario context
index.scenario.generate = async (request = {}) => {
  const axiosConfig =
    buildAxiosConfig(request, '/learning/scenario/generate', 'POST');
  try {
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response)
    };
  } catch (err) {
    // Debug: log the error structure
    console.log('API Client Error:', {
      hasResponse: !!err.response,
      hasRequest: !!err.request,
      status: err.response?.status,
      message: err.message,
      errorKeys: Object.keys(err)
    });
    // Handle axios errors (4xx, 5xx status codes)
    if (err.response) {
      return {
        statusCode: err.response.status,
        headers: err.response.headers || {},
        body: err.response.data,
        data: err.response.data // Use raw error response data instead of extractData
      };
    }
    // Handle request errors (no response received)
    if (err.request) {
      return {
        statusCode: 0,
        headers: {},
        body: null,
        data: { error: 'No response received from server' }
      };
    }
    // Re-throw other errors (network errors, etc.)
    throw err;
  }
};
// Add raw method that returns full axios response
index.scenario.generate.raw =
  async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/learning/scenario/generate',
      'POST');
    return await axiosClient.request(axiosConfig);
};
// Chat with AI using a system prompt and message history
index.scenario.chat = async (request = {}) => {
  const axiosConfig =
    buildAxiosConfig(request, '/learning/scenario/chat', 'POST');
  try {
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response)
    };
  } catch (err) {
    // Debug: log the error structure
    console.log('API Client Error:', {
      hasResponse: !!err.response,
      hasRequest: !!err.request,
      status: err.response?.status,
      message: err.message,
      errorKeys: Object.keys(err)
    });
    // Handle axios errors (4xx, 5xx status codes)
    if (err.response) {
      return {
        statusCode: err.response.status,
        headers: err.response.headers || {},
        body: err.response.data,
        data: err.response.data // Use raw error response data instead of extractData
      };
    }
    // Handle request errors (no response received)
    if (err.request) {
      return {
        statusCode: 0,
        headers: {},
        body: null,
        data: { error: 'No response received from server' }
      };
    }
    // Re-throw other errors (network errors, etc.)
    throw err;
  }
};
// Add raw method that returns full axios response
index.scenario.chat.raw =
  async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/learning/scenario/chat',
      'POST');
    return await axiosClient.request(axiosConfig);
};
// Create ephemeral token for OpenAI Realtime API
index.scenario.realtimeSession = async (request = {}) => {
  const axiosConfig =
    buildAxiosConfig(request, '/learning/scenario/realtime-session', 'POST');
  try {
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response)
    };
  } catch (err) {
    // Debug: log the error structure
    console.log('API Client Error:', {
      hasResponse: !!err.response,
      hasRequest: !!err.request,
      status: err.response?.status,
      message: err.message,
      errorKeys: Object.keys(err)
    });
    // Handle axios errors (4xx, 5xx status codes)
    if (err.response) {
      return {
        statusCode: err.response.status,
        headers: err.response.headers || {},
        body: err.response.data,
        data: err.response.data // Use raw error response data instead of extractData
      };
    }
    // Handle request errors (no response received)
    if (err.request) {
      return {
        statusCode: 0,
        headers: {},
        body: null,
        data: { error: 'No response received from server' }
      };
    }
    // Re-throw other errors (network errors, etc.)
    throw err;
  }
};
// Add raw method that returns full axios response
index.scenario.realtimeSession.raw =
  async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/learning/scenario/realtime-session',
      'POST');
    return await axiosClient.request(axiosConfig);
};
// Ask the courseware assistant
index.coursewareAssistant.chat = async (request = {}) => {
  const axiosConfig =
    buildAxiosConfig(request, '/assistant/chat', 'POST');
  try {
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response)
    };
  } catch (err) {
    // Debug: log the error structure
    console.log('API Client Error:', {
      hasResponse: !!err.response,
      hasRequest: !!err.request,
      status: err.response?.status,
      message: err.message,
      errorKeys: Object.keys(err)
    });
    // Handle axios errors (4xx, 5xx status codes)
    if (err.response) {
      return {
        statusCode: err.response.status,
        headers: err.response.headers || {},
        body: err.response.data,
        data: err.response.data // Use raw error response data instead of extractData
      };
    }
    // Handle request errors (no response received)
    if (err.request) {
      return {
        statusCode: 0,
        headers: {},
        body: null,
        data: { error: 'No response received from server' }
      };
    }
    // Re-throw other errors (network errors, etc.)
    throw err;
  }
};
// Add raw method that returns full axios response
index.coursewareAssistant.chat.raw =
  async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/assistant/chat',
      'POST');
    return await axiosClient.request(axiosConfig);
};
// Reset database with base seed data
index.seed.resetDatabase = async (request = {}) => {
  const axiosConfig =
    buildAxiosConfig(request, '/seed/reset', 'POST');
  try {
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response)
    };
  } catch (err) {
    // Debug: log the error structure
    console.log('API Client Error:', {
      hasResponse: !!err.response,
      hasRequest: !!err.request,
      status: err.response?.status,
      message: err.message,
      errorKeys: Object.keys(err)
    });
    // Handle axios errors (4xx, 5xx status codes)
    if (err.response) {
      return {
        statusCode: err.response.status,
        headers: err.response.headers || {},
        body: err.response.data,
        data: err.response.data // Use raw error response data instead of extractData
      };
    }
    // Handle request errors (no response received)
    if (err.request) {
      return {
        statusCode: 0,
        headers: {},
        body: null,
        data: { error: 'No response received from server' }
      };
    }
    // Re-throw other errors (network errors, etc.)
    throw err;
  }
};
// Add raw method that returns full axios response
index.seed.resetDatabase.raw =
  async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/seed/reset',
      'POST');
    return await axiosClient.request(axiosConfig);
};
// Create a single test user
index.seed.seedUser = async (request = {}) => {
  const axiosConfig =
    buildAxiosConfig(request, '/seed/user', 'POST');
  try {
    const response = await axiosClient.request(axiosConfig);
    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
      data: extractData(response)
    };
  } catch (err) {
    // Debug: log the error structure
    console.log('API Client Error:', {
      hasResponse: !!err.response,
      hasRequest: !!err.request,
      status: err.response?.status,
      message: err.message,
      errorKeys: Object.keys(err)
    });
    // Handle axios errors (4xx, 5xx status codes)
    if (err.response) {
      return {
        statusCode: err.response.status,
        headers: err.response.headers || {},
        body: err.response.data,
        data: err.response.data // Use raw error response data instead of extractData
      };
    }
    // Handle request errors (no response received)
    if (err.request) {
      return {
        statusCode: 0,
        headers: {},
        body: null,
        data: { error: 'No response received from server' }
      };
    }
    // Re-throw other errors (network errors, etc.)
    throw err;
  }
};
// Add raw method that returns full axios response
index.seed.seedUser.raw =
  async (request = {}) => {
    const axiosConfig = buildAxiosConfig(
      request,
      '/seed/user',
      'POST');
    return await axiosClient.request(axiosConfig);
};
        return index;
      }

      export default createApiClient;