export function isTransactionError(error: unknown): error is { code: string; message: string; reason?: string } {
  return typeof error === 'object' && 
         error !== null && 
         'code' in error &&
         typeof (error as any).code === 'string' &&
         'message' in error &&
         typeof (error as any).message === 'string';
}

export function getTransactionErrorMessage(error: unknown): string {
  if (!isTransactionError(error)) {
    return 'An unexpected error occurred';
  }

  switch (error.code) {
    case 'CALL_EXCEPTION':
      return 'Transaction failed. The pool may already exist or parameters are invalid.';
    case 'UNPREDICTABLE_GAS_LIMIT':
      return 'Failed to estimate gas. The pool may already exist.';
    case 'ACTION_REJECTED':
      return 'Transaction was rejected by user.';
    default:
      return error.reason || error.message || 'Transaction failed';
  }
}
