import { user } from '@template/database/schema';

type UserModel = typeof user.$inferSelect;

export class UserEntity {
  public readonly id: string;
  public readonly name: string;
  public readonly email: string;

  private constructor({ id, name, email }: { id: string; name: string; email: string }) {
    this.id = id;
    this.name = name;
    this.email = email;
  }

  public static fromModel(userModel: UserModel) {
    return new UserEntity({
      id: userModel.id,
      name: userModel.name,
      email: userModel.email,
    });
  }
}
