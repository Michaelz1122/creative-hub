"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getActionErrorCode,
  getFormString,
  getOptionalFormString,
  rethrowRedirectError,
  requireFormString,
  ValidationError,
} from "@/lib/validation";

function revalidateRoleSurfaces() {
  revalidatePath("/admin/roles");
  revalidatePath("/admin/users");
}

function validateRoleName(value: string) {
  if (!/^[a-z0-9_:-]{3,80}$/.test(value)) {
    throw new ValidationError("invalid-role-name", "Role name must be lowercase and machine-safe.");
  }

  return value;
}

export async function saveRoleAction(formData: FormData) {
  const admin = await requirePermission("roles.manage");

  try {
    const roleId = getFormString(formData, "roleId");
    const name = validateRoleName(requireFormString(formData, "name"));
    const label = requireFormString(formData, "label", { minLength: 2, maxLength: 120 });
    const description = getOptionalFormString(formData, "description", 600);

    const role = roleId
      ? await prisma.role.update({
          where: { id: roleId },
          data: {
            name,
            label,
            description,
          },
        })
      : await prisma.role.create({
          data: {
            name,
            label,
            description,
            isSystem: false,
          },
        });

    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        entityType: "Role",
        entityId: role.id,
        action: roleId ? "update" : "create",
        summary: `${roleId ? "Updated" : "Created"} role ${role.name}`,
      },
    });

    revalidateRoleSurfaces();
    redirect("/admin/roles?success=role-saved");
  } catch (error) {
    rethrowRedirectError(error);
    redirect(`/admin/roles?error=${getActionErrorCode(error, "role-save-failed")}`);
  }
}

export async function syncRolePermissionsAction(formData: FormData) {
  const admin = await requirePermission("roles.manage");

  try {
    const roleId = requireFormString(formData, "roleId");
    const permissionIds = Array.from(
      new Set(
        formData
          .getAll("permissionIds")
          .map((value) => String(value || "").trim())
          .filter(Boolean),
      ),
    );

    const [role, permissions] = await Promise.all([
      prisma.role.findUnique({
        where: { id: roleId },
        select: { id: true, name: true },
      }),
      prisma.permission.findMany({
        where: permissionIds.length ? { id: { in: permissionIds } } : undefined,
        select: { id: true },
      }),
    ]);

    if (!role) {
      throw new ValidationError("missing-role", "Role was not found.");
    }

    if (permissions.length !== permissionIds.length) {
      throw new ValidationError("invalid-permission-selection", "Some selected permissions were not found.");
    }

    await prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({
        where: { roleId },
      });

      if (permissionIds.length) {
        await tx.rolePermission.createMany({
          data: permissionIds.map((permissionId) => ({
            roleId,
            permissionId,
          })),
          skipDuplicates: true,
        });
      }

      await tx.auditLog.create({
        data: {
          actorUserId: admin.id,
          entityType: "Role",
          entityId: role.id,
          action: "sync_permissions",
          summary: `Synced permissions for role ${role.name}`,
          payload: {
            permissionIds,
          },
        },
      });
    });

    revalidateRoleSurfaces();
    redirect("/admin/roles?success=permissions-saved");
  } catch (error) {
    rethrowRedirectError(error);
    redirect(`/admin/roles?error=${getActionErrorCode(error, "role-permissions-failed")}`);
  }
}

export async function assignUserRoleAction(formData: FormData) {
  const admin = await requirePermission("roles.manage");

  try {
    const userId = requireFormString(formData, "userId");
    const roleId = requireFormString(formData, "roleId");

    const [user, role] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true },
      }),
      prisma.role.findUnique({
        where: { id: roleId },
        select: { id: true, name: true, label: true },
      }),
    ]);

    if (!user) {
      throw new ValidationError("missing-user", "User was not found.");
    }

    if (!role) {
      throw new ValidationError("missing-role", "Role was not found.");
    }

    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
      update: {},
      create: {
        userId,
        roleId,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        entityType: "UserRole",
        entityId: `${userId}:${roleId}`,
        action: "assign",
        summary: `Assigned role ${role.name} to ${user.email}`,
      },
    });

    revalidateRoleSurfaces();
    redirect("/admin/roles?success=user-role-assigned");
  } catch (error) {
    rethrowRedirectError(error);
    redirect(`/admin/roles?error=${getActionErrorCode(error, "user-role-assign-failed")}`);
  }
}

export async function removeUserRoleAction(formData: FormData) {
  const admin = await requirePermission("roles.manage");

  try {
    const userRoleId = requireFormString(formData, "userRoleId");

    const userRole = await prisma.userRole.findUnique({
      where: { id: userRoleId },
      include: {
        user: true,
        role: true,
      },
    });

    if (!userRole) {
      throw new ValidationError("missing-user-role", "Role assignment was not found.");
    }

    if (userRole.role.name === "super_admin") {
      const superAdminCount = await prisma.userRole.count({
        where: {
          roleId: userRole.roleId,
        },
      });

      if (superAdminCount <= 1) {
        throw new ValidationError("last-super-admin", "You cannot remove the last super admin.");
      }
    }

    await prisma.userRole.delete({
      where: { id: userRoleId },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        entityType: "UserRole",
        entityId: userRoleId,
        action: "remove",
        summary: `Removed role ${userRole.role.name} from ${userRole.user.email}`,
      },
    });

    revalidateRoleSurfaces();
    redirect("/admin/roles?success=user-role-removed");
  } catch (error) {
    rethrowRedirectError(error);
    redirect(`/admin/roles?error=${getActionErrorCode(error, "user-role-remove-failed")}`);
  }
}
