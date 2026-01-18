import { AuthService, authSymbol } from '@/lib/auth.ts';
import { UserContext } from '@/lib/context.ts';
import { inject, injectable } from 'inversify';
import { OrganizationRepository } from './organization-repository.ts';

export interface CreateOrganizationInput {
  name: string;
  slug: string;
  logo?: string;
  metadata?: Record<string, unknown>;
}

export interface SetActiveOrganizationInput {
  organizationId: string | null;
}

export interface UpdateOrganizationInput {
  organizationId: string;
  name?: string;
  slug?: string;
  logo?: string;
  metadata?: Record<string, unknown>;
}

export interface ListOrganizationsInput {
  limit?: number;
  offset?: number;
  search?: string;
}

export interface AddMemberInput {
  organizationId: string;
  userId: string;
  role: 'member' | 'admin' | 'owner';
}

export interface RemoveMemberInput {
  organizationId: string;
  memberIdOrEmail: string;
}

export interface UpdateMemberRoleInput {
  organizationId: string;
  memberId: string;
  role: 'member' | 'admin' | 'owner';
}

@injectable()
export class OrganizationService {
  constructor(
    @inject(OrganizationRepository)
    private organizationRepository: OrganizationRepository,
    @inject(authSymbol) private auth: AuthService
  ) {}

  public async createOrganization(
    ctx: UserContext,
    input: CreateOrganizationInput,
    headers: Headers
  ) {
    ctx.logger.info(`Service: Creating organization with slug: ${input.slug}`);

    const result = await this.auth.api.createOrganization({
      body: {
        name: input.name,
        slug: input.slug,
        logo: input.logo,
        metadata: input.metadata,
      },
      headers,
    });

    if (!result) {
      throw new Error('Failed to create organization');
    }

    ctx.logger.info(`Organization created: ${result.id}`);
    return result;
  }

  public async listUserOrganizations(ctx: UserContext, headers: Headers) {
    ctx.logger.info('Service: Listing user organizations');

    const result = await this.auth.api.listOrganizations({
      headers,
    });

    ctx.logger.info(`Found ${result.length} organizations for user`);
    return result;
  }

  public async getFullOrganization(
    ctx: UserContext,
    organizationId: string | undefined,
    headers: Headers
  ) {
    ctx.logger.info(`Service: Getting full organization: ${organizationId ?? 'active'}`);

    const result = await this.auth.api.getFullOrganization({
      query: organizationId ? { organizationId } : {},
      headers,
    });

    return result;
  }

  public async getActiveOrganization(ctx: UserContext, headers: Headers) {
    ctx.logger.info(`Service: Getting active organization`);

    const result = await this.auth.api.getFullOrganization({
      headers,
    });

    return result;
  }

  public async setActiveOrganization(
    ctx: UserContext,
    input: SetActiveOrganizationInput,
    headers: Headers
  ) {
    ctx.logger.info(`Service: Setting active organization: ${input.organizationId}`);

    const result = await this.auth.api.setActiveOrganization({
      body: {
        organizationId: input.organizationId,
      },
      headers,
    });

    return result;
  }

  public async checkSlug(ctx: UserContext, slug: string, headers: Headers) {
    ctx.logger.info(`Service: Checking if slug is available: ${slug}`);

    const result = await this.auth.api.checkOrganizationSlug({
      body: { slug },
      headers,
    });

    return result;
  }

  public async getOrganizationById(ctx: UserContext, id: string) {
    ctx.logger.info(`Service: Getting organization by ID: ${id}`);
    return this.organizationRepository.organizationById(id);
  }

  public async getOrganizationBySlug(ctx: UserContext, slug: string) {
    ctx.logger.info(`Service: Getting organization by slug: ${slug}`);
    return this.organizationRepository.organizationBySlug(slug);
  }

  // Admin methods
  public async listAllOrganizations(ctx: UserContext, input: ListOrganizationsInput) {
    ctx.logger.info('Admin: Listing all organizations');
    return this.organizationRepository.listAll(input);
  }

  public async updateOrganization(
    ctx: UserContext,
    input: UpdateOrganizationInput,
    headers: Headers
  ) {
    ctx.logger.info(`Admin: Updating organization: ${input.organizationId}`);

    const result = await this.auth.api.updateOrganization({
      body: {
        data: {
          name: input.name,
          slug: input.slug,
          logo: input.logo,
          metadata: input.metadata,
        },
        organizationId: input.organizationId,
      },
      headers,
    });

    ctx.logger.info(`Organization updated: ${input.organizationId}`);
    return result;
  }

  public async deleteOrganization(ctx: UserContext, organizationId: string, headers: Headers) {
    ctx.logger.info(`Admin: Deleting organization: ${organizationId}`);

    await this.auth.api.deleteOrganization({
      body: { organizationId },
      headers,
    });

    ctx.logger.info(`Organization deleted: ${organizationId}`);
    return { success: true };
  }

  public async listMembers(
    ctx: UserContext,
    organizationId: string,
    options: { limit?: number; offset?: number },
    headers: Headers
  ) {
    ctx.logger.info(`Admin: Listing members for organization: ${organizationId}`);

    const result = await this.auth.api.listMembers({
      query: {
        organizationId,
        limit: options.limit,
        offset: options.offset,
      },
      headers,
    });

    ctx.logger.info(`Found ${result.members.length} members`);
    return result;
  }

  public async addMember(ctx: UserContext, input: AddMemberInput, headers: Headers) {
    ctx.logger.info(`Admin: Adding member ${input.userId} to organization ${input.organizationId}`);

    const result = await this.auth.api.addMember({
      body: {
        userId: input.userId,
        role: input.role,
        organizationId: input.organizationId,
      },
      headers,
    });

    ctx.logger.info(`Member added to organization`);
    return result;
  }

  public async removeMember(ctx: UserContext, input: RemoveMemberInput, headers: Headers) {
    ctx.logger.info(
      `Admin: Removing member ${input.memberIdOrEmail} from organization ${input.organizationId}`
    );

    await this.auth.api.removeMember({
      body: {
        memberIdOrEmail: input.memberIdOrEmail,
        organizationId: input.organizationId,
      },
      headers,
    });

    ctx.logger.info(`Member removed from organization`);
    return { success: true };
  }

  public async updateMemberRole(ctx: UserContext, input: UpdateMemberRoleInput, headers: Headers) {
    ctx.logger.info(
      `Admin: Updating role for member ${input.memberId} in organization ${input.organizationId}`
    );

    const result = await this.auth.api.updateMemberRole({
      body: {
        memberId: input.memberId,
        role: input.role,
        organizationId: input.organizationId,
      },
      headers,
    });

    ctx.logger.info(`Member role updated`);
    return result;
  }
}
