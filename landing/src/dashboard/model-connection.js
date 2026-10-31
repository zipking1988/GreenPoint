export const initialModelConnection = {
  configured: false,
  checked: false,
  error: false,
  verified: [],
  accessCode: '',
  revision: 0,
};

// A revision ties successful model calls to the credentials used by that run.
// Later credential changes or authentication failures invalidate older replies.
export function modelConnectionReducer(state, action) {
  switch (action.type) {
    case 'access-code':
      if (state.accessCode === action.value) return state;
      return { ...state, accessCode: action.value, verified: [], revision: state.revision + 1 };
    case 'configuration': {
      const available = action.configured && !action.error;
      return { ...state, checked: true, configured: available, error: Boolean(action.error), verified: available ? state.verified : [], revision: available ? state.revision : state.revision + 1 };
    }
    case 'verified':
      if (action.revision !== state.revision || !state.configured || state.error) return state;
      return { ...state, verified: [...new Set([...state.verified, action.model])] };
    case 'authentication-failed':
      if (action.revision !== state.revision) return state;
      return { ...state, verified: [], revision: state.revision + 1 };
    default:
      return state;
  }
}

export async function checkModelConfiguration(dispatch, fetcher = fetch) {
  try {
    const response = await fetcher('/api/health', { signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error('Health check failed');
    const body = await response.json();
    if (typeof body.configured !== 'boolean') throw new Error('Invalid health response');
    dispatch({ type: 'configuration', configured: body.configured, error: false });
  } catch {
    dispatch({ type: 'configuration', configured: false, error: true });
  }
}
