import { inject, injectable } from 'inversify';
import { UserService } from './users/user-service.ts';

@injectable()
export class AppDomain {
  constructor(@inject(UserService) public userService: UserService) {}
}
