import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { Pool } from "pg";
import { PG_POOL } from "../database/database.module";
import { AuditService } from "../common/audit.service";
import { RegisterDto, LoginDto } from "./dto/auth.dto";

const BCRYPT_ROUNDS = 12;

/**
 * Real authentication: bcrypt password hashing (never plaintext, spec
 * section 39), JWT session issuance. Registration is scoped to an existing
 * organization by slug — there is no implicit cross-tenant signup.
 */
@Injectable()
export class AuthService {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly jwt: JwtService,
    private readonly audit: AuditService,
  ) {}

  async register(dto: RegisterDto) {
    const org = await this.pool.query(
      `SELECT id FROM organizations WHERE slug = $1 AND deleted_at IS NULL`,
      [dto.organizationSlug],
    );
    if (org.rowCount === 0) {
      throw new UnauthorizedException("Unknown organization.");
    }
    const organizationId = org.rows[0].id;

    const existing = await this.pool.query(
      `SELECT id FROM users WHERE organization_id = $1 AND email = $2`,
      [organizationId, dto.email],
    );
    if ((existing.rowCount ?? 0) > 0) {
      throw new ConflictException("A user with this email already exists in this organization.");
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    let result;
    try {
      result = await this.pool.query(
        `INSERT INTO users (organization_id, email, password_hash, display_name)
         VALUES ($1,$2,$3,$4)
         RETURNING id, organization_id, email, display_name, role`,
        [organizationId, dto.email, passwordHash, dto.displayName],
      );
    } catch (err) {
      // 23505 = unique_violation. The app-level check above closes the
      // common case, but two concurrent registrations for the same email
      // can both pass it before either commits; the DB constraint
      // (users_organization_id_email_key) is the real source of truth.
      if ((err as { code?: string }).code === "23505") {
        throw new ConflictException(
          "A user with this email already exists in this organization.",
        );
      }
      throw err;
    }

    const user = result.rows[0];
    await this.audit.record({
      organizationId,
      actorUserId: user.id,
      actorType: "user",
      action: "auth.register",
      resourceType: "user",
      resourceId: user.id,
    });

    return this.issueSession(user);
  }

  async login(dto: LoginDto) {
    const result = await this.pool.query(
      `SELECT id, organization_id, email, password_hash, display_name, role, is_active
       FROM users WHERE email = $1 AND deleted_at IS NULL`,
      [dto.email],
    );

    if (result.rowCount === 0) {
      throw new UnauthorizedException("Invalid email or password.");
    }
    const user = result.rows[0];

    if (!user.is_active) {
      throw new UnauthorizedException("This account has been deactivated.");
    }

    const valid = await bcrypt.compare(dto.password, user.password_hash);
    if (!valid) {
      await this.audit.record({
        organizationId: user.organization_id,
        actorUserId: user.id,
        actorType: "user",
        action: "auth.login_failed",
      });
      throw new UnauthorizedException("Invalid email or password.");
    }

    await this.pool.query(`UPDATE users SET last_login_at = now() WHERE id = $1`, [user.id]);
    await this.audit.record({
      organizationId: user.organization_id,
      actorUserId: user.id,
      actorType: "user",
      action: "auth.login",
    });

    return this.issueSession(user);
  }

  private issueSession(user: {
    id: string;
    organization_id: string;
    email: string;
    display_name: string;
    role: string;
  }) {
    const payload = {
      sub: user.id,
      organizationId: user.organization_id,
      email: user.email,
      role: user.role,
    };
    const accessToken = this.jwt.sign(payload);
    return {
      accessToken,
      user: {
        id: user.id,
        organizationId: user.organization_id,
        email: user.email,
        displayName: user.display_name,
        role: user.role,
      },
    };
  }
}
