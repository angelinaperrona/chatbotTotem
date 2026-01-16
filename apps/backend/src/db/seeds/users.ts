import type { Database } from "bun:sqlite";
import bcrypt from "bcryptjs";

const ADMIN_USER = {
  id: "admin-001",
  username: "admin",
  password: "admin123",
  role: "admin" as const,
  name: "Administrador",
};

const AGENT_USERS = [
  {
    id: "agent-001",
    username: "agent1",
    password: "agent123",
    role: "sales_agent" as const,
    name: "María González",
    phoneNumber: "+51914509251",
  },
  {
    id: "agent-002",
    username: "agent2",
    password: "agent123",
    role: "sales_agent" as const,
    name: "Carlos Pérez",
    phoneNumber: "+51919284799",
  },
];

export async function seedUsers(db: Database) {
  const exists = db.prepare("SELECT count(*) as count FROM users").get() as {
    count: number;
  };

  if (exists.count > 0) {
    return;
  }

  const adminHash = bcrypt.hashSync(ADMIN_USER.password, 10);
  db.prepare(
    `INSERT INTO users (id, username, password_hash, role, name, created_by)
     VALUES (?, ?, ?, ?, ?, NULL)`,
  ).run(
    ADMIN_USER.id,
    ADMIN_USER.username,
    adminHash,
    ADMIN_USER.role,
    ADMIN_USER.name,
  );

  const agentHash = bcrypt.hashSync(AGENT_USERS[0]!.password, 10);
  const agentStmt = db.prepare(
    `INSERT INTO users (id, username, password_hash, role, name, phone_number, is_available, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  for (const agent of AGENT_USERS) {
    agentStmt.run(
      agent.id,
      agent.username,
      agentHash,
      agent.role,
      agent.name,
      agent.phoneNumber,
      1,
      ADMIN_USER.id,
    );
  }
}
