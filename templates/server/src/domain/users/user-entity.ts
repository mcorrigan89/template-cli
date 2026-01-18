import { session, user } from '@template/database/schema';

type UserModel = typeof user.$inferSelect;
type SessionModel = typeof session.$inferSelect;

export class UserEntity {
  public readonly id: string;
  public readonly name: string;
  public readonly email: string;
  public readonly emailVerified: boolean;
  public readonly image?: string | null;

  private constructor(userModel: UserModel) {
    this.id = userModel.id;
    this.name = userModel.name;
    this.email = userModel.email;
    this.emailVerified = userModel.emailVerified;
    this.image = userModel.image;
  }

  public static fromModel(userModel: UserModel) {
    return new UserEntity(userModel);
  }
}

export class UserSessionEntity {
  public readonly id: string;
  public readonly userId: string;
  public readonly createdAt: Date;
  public readonly expiresAt: Date;
  public readonly userAgent: string | null;
  public readonly ipAddress: string | null;

  private constructor(sessionModel: SessionModel) {
    this.id = sessionModel.id;
    this.userId = sessionModel.userId;
    this.createdAt = sessionModel.createdAt;
    this.expiresAt = sessionModel.expiresAt;
    this.userAgent = sessionModel.userAgent;
    this.ipAddress = sessionModel.ipAddress;
  }

  public static fromModel(sessionModel: SessionModel) {
    return new UserSessionEntity(sessionModel);
  }
}
