import { inject, injectable } from 'inversify';
import { MediaService } from './media/media-service.ts';
import { UserService } from './users/user-service.ts';

@injectable()
export class AppDomain {
  constructor(
    @inject(UserService) public userService: UserService,
    @inject(MediaService) public mediaService: MediaService
  ) {}
}
