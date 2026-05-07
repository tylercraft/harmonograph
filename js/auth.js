// Google Calendar OAuth via chrome.identity.getAuthToken.
// Token caching and refresh are handled automatically by Chrome.
// The oauth2 client_id and scopes live in manifest.json.

function extractToken(result) {
  // MV3: getAuthToken returns { token, grantedScopes }; older builds return a plain string
  return typeof result === 'string' ? result : (result?.token ?? null);
}

async function getCalendarToken(accountKey, interactive = false) {
  try {
    const result = await chrome.identity.getAuthToken({ interactive });
    return extractToken(result);
  } catch {
    return null;
  }
}

async function clearCalendarToken(accountKey) {
  try {
    const result = await chrome.identity.getAuthToken({ interactive: false });
    const token  = extractToken(result);
    if (token) await chrome.identity.removeCachedAuthToken({ token });
  } catch { /* no cached token */ }
}
