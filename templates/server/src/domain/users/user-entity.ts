import { session, user } from '@template/database/schema';
import { getSharedEnv } from '@template/env/shared';
import { ImageEntity, ImageModel } from '../media/image-entity.ts';

const env = getSharedEnv();

export type UserModel = typeof user.$inferSelect;
export type SessionModel = typeof session.$inferSelect;

export class UserEntity {
  public readonly id: string;
  private _name: string;
  private _email: string;
  private _emailVerified: boolean;
  private _avatarId?: string | null;
  private _avatarEntity: ImageEntity | null;

  private constructor(userModel: UserModel, imageModel?: ImageModel) {
    this.id = userModel.id;
    this._name = userModel.name;
    this._email = userModel.email;
    this._emailVerified = userModel.emailVerified;
    this._avatarId = userModel.imageId;
    this._avatarEntity = imageModel ? ImageEntity.fromModel(imageModel) : null;
  }

  get name() {
    return this._name;
  }

  get email() {
    return this._email;
  }

  get emailVerified() {
    return this._emailVerified;
  }

  get avatarId() {
    return this._avatarId ?? undefined;
  }

  set avatarId(avatarId: string | undefined) {
    this._avatarId = avatarId ?? null;
  }

  get initials() {
    if (!this.name) {
      return '';
    }
    const names = this.name.trim().split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    return (
      names[0].charAt(0).toUpperCase() + names[names.length - 1].charAt(0).toUpperCase()
    ).slice(0, 3);
  }

  get avatarUrl() {
    return this._avatarEntity ? this._avatarEntity.url : undefined;
  }

  public static fromModel(userModel: UserModel, imageModel?: ImageModel) {
    return new UserEntity(userModel, imageModel);
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
