import { count, eq, ilike, or } from 'drizzle-orm';
import { inject, injectable } from 'inversify';
import { fromSafePromise } from 'neverthrow';

import { UserContext } from '@/lib/context.ts';
import { dbSymbol } from '@/lib/di.ts';
import { Database } from '@template/database';
import { member, organization } from '@template/database/schema';

@injectable()
export class OrganizationRepository {
  constructor(@inject(dbSymbol) private db: Database) {}

  public async organizationById(ctx: UserContext, id: string) {
    ctx.logger.trace(`Fetching organization by ID: ${id}`);
    const result = await fromSafePromise(
      this.db.select().from(organization).where(eq(organization.id, id))
    );
    if (result.isErr()) {
      ctx.logger.error(`Error fetching organization by ID: ${id} - ${result.error}`);
      throw result.error;
    }
    if (result.value.length === 0) {
      ctx.logger.warn(`Organization not found with ID: ${id}`);
      return null;
    }
    return result.value[0];
  }

  public async organizationBySlug(ctx: UserContext, slug: string) {
    ctx.logger.trace(`Fetching organization by slug: ${slug}`);
    const result = await fromSafePromise(
      this.db.select().from(organization).where(eq(organization.slug, slug))
    );
    if (result.isErr()) {
      ctx.logger.error(`Error fetching organization by slug: ${slug} - ${result.error}`);
      throw result.error;
    }
    if (result.value.length === 0) {
      ctx.logger.warn(`Organization not found with slug: ${slug}`);
      return null;
    }
    return result.value[0];
  }

  public async membersByOrganizationId(ctx: UserContext, organizationId: string) {
    ctx.logger.info(`Fetching members for organization: ${organizationId}`);
    const result = await fromSafePromise(
      this.db.select().from(member).where(eq(member.organizationId, organizationId))
    );
    if (result.isErr()) {
      ctx.logger.error(
        `Error fetching members for organization: ${organizationId} - ${result.error}`
      );
      throw result.error;
    }
    return result.value;
  }

  public async membershipsByUserId(ctx: UserContext, userId: string) {
    ctx.logger.info(`Fetching memberships for user: ${userId}`);
    const result = await fromSafePromise(
      this.db.select().from(member).where(eq(member.userId, userId))
    );
    if (result.isErr()) {
      ctx.logger.error(`Error fetching memberships for user: ${userId} - ${result.error}`);
      throw result.error;
    }
    return result.value;
  }

  public async listAll(
    ctx: UserContext,
    options: { limit?: number; offset?: number; search?: string }
  ) {
    ctx.logger.info('Fetching all organizations');
    const { limit = 100, offset = 0, search } = options;

    const whereClause = search
      ? or(ilike(organization.name, `%${search}%`), ilike(organization.slug, `%${search}%`))
      : undefined;

    const [orgsResult, countResult] = await Promise.all([
      fromSafePromise(
        this.db.select().from(organization).where(whereClause).limit(limit).offset(offset)
      ),
      fromSafePromise(this.db.select({ count: count() }).from(organization).where(whereClause)),
    ]);

    if (orgsResult.isErr()) {
      ctx.logger.error(`Error fetching organizations: ${orgsResult.error}`);
      throw orgsResult.error;
    }
    if (countResult.isErr()) {
      ctx.logger.error(`Error counting organizations: ${countResult.error}`);
      throw countResult.error;
    }

    return {
      organizations: orgsResult.value,
      total: countResult.value[0]?.count ?? 0,
    };
  }
}
