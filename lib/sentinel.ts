export const sendAnonymousSentinelReport = async (error: any) => {
  try {
    if (!error) return;

    const response = await fetch('/api/sentinel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: {
          message: error.message,
          stack: error.stack,
          url: error.url,
          line: error.line,
          column: error.column,
          errorType: error.errorType,
          errorName: error.errorName,
          errorMessage: error.errorMessage,
          errorStack: error.errorStack,
          apiError: error.apiError,
          apiErrorMessage: error.apiErrorMessage,
          apiErrorStatus: error.apiErrorStatus,
          apiErrorCode: error.apiErrorCode,
          apiErrorPath: error.apiErrorPath,
          apiErrorMethod: error.apiErrorMethod,
          apiErrorResponse: error.apiErrorResponse,
        },
      }),
    });

    return response;
  } catch (error) {
    // Do nothing
  }
};
