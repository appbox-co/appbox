const DEFAULT_AUTH_REDIRECT = "/dashboard"
const UNSAFE_REDIRECT_CHARACTERS = /[\\\u0000-\u001F\u007F]/

export function getSafeAuthRedirect(redirect: string | null): string {
  if (
    !redirect ||
    !redirect.startsWith("/") ||
    redirect.startsWith("//") ||
    UNSAFE_REDIRECT_CHARACTERS.test(redirect)
  ) {
    return DEFAULT_AUTH_REDIRECT
  }

  return redirect
}
