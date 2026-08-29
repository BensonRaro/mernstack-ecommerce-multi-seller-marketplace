import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from "better-auth/plugins/admin/access";

const statement = {
  ...defaultStatements,
  product: ["create", "read", "update", "delete"],
  order: ["create", "read", "update", "delete"],
  category: ["create", "read", "update", "delete"],
} as const;

export const ac = createAccessControl(statement);

export const buyer = ac.newRole({
  user: ["get", "update"],
  session: ["list", "revoke"],
  product: ["read"],
  order: ["create", "read"],
});

export const seller = ac.newRole({
  user: ["get", "update"],
  session: ["list", "revoke"],
  product: ["create", "read", "update", "delete"],
  order: ["read", "update"],
  category: ["read"],
});

export const admin = ac.newRole({
  ...adminAc.statements,
  product: ["create", "read", "update", "delete"],
  order: ["create", "read", "update", "delete"],
  category: ["create", "read", "update", "delete"],
});
