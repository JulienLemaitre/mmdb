import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/options";
import { UserRole, userRoleOrderedList } from "@/utils/constants";

/**
 * Checks if the current session user has a role equal to or higher than the required role.
 * @param requiredRole The minimum role required to pass the check.
 * @returns {Promise<boolean>} True if the user has sufficient permissions.
 */
export async function hasMinimalRole(requiredRole: UserRole) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error("Unauthorized", {
      cause: "No session found",
    });
  }
  const role = session.user.role as UserRole | undefined;
  if (!role) {
    throw new Error("Unauthorized", {
      cause: "Role not found",
    });
  }
  const roleIndex = userRoleOrderedList.indexOf(role);

  if (roleIndex === -1) {
    throw new Error("Unauthorized", {
      cause: `Role unknown: ${role}`,
    });
  }

  const minimalRoleIndex = userRoleOrderedList.indexOf(
    requiredRole as UserRole,
  );
  return roleIndex >= minimalRoleIndex;
}
