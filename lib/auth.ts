import { getSession, SessionPayload } from "./jwt";

type Role = "ADMIN" | "PROCUREMENT_OFFICER" | "MANAGER_APPROVER" | "VENDOR";

/**
 * Returns session if the user is authenticated and has one of the allowed roles.
 * Returns null otherwise. Use in route handlers to guard endpoints.
 */
export async function requireAuth(
  allowedRoles?: Role[]
): Promise<SessionPayload | null> {
  const session = await getSession();
  if (!session) return null;
  if (allowedRoles && !allowedRoles.includes(session.role as Role)) return null;
  return session;
}
