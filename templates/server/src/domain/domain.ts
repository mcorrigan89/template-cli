import { inject, injectable } from 'inversify';
import { MediaService } from './media/media-service.ts';
import { OrganizationService } from './organizations/organization-service.ts';
import { UserService } from './users/user-service.ts';

@injectable()
export class AppDomain {
  constructor(
    @inject(UserService) public userService: UserService,
    @inject(MediaService) public mediaService: MediaService,
    @inject(OrganizationService) public organizationService: OrganizationService
  ) {}
}
