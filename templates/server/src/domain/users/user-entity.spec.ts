import { faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';
import { ImageEntity, ImageModel } from '../media/image-entity.ts';
import { SessionModel, UserEntity, UserModel, UserSessionEntity } from './user-entity.ts';

describe('UserEntity', () => {
  it('should create a UserEntity from a UserModel', () => {
    const userModel: UserModel = {
      id: faker.string.uuid(),
      name: faker.person.fullName(),
      email: faker.internet.email(),
      emailVerified: faker.datatype.boolean(),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      role: 'owner',
      banExpires: null,
      banReason: null,
      banned: false,
      imageId: null,
    };

    const userEntity = UserEntity.fromModel(userModel);
    expect(userEntity.id).toBe(userModel.id);
    expect(userEntity.name).toBe(userModel.name);
    expect(userEntity.email).toBe(userModel.email);
    expect(userEntity.emailVerified).toBe(userModel.emailVerified);
  });

  it('should return initials based on the name', () => {
    const userModel: UserModel = {
      id: faker.string.uuid(),
      name: 'John Doe',
      email: faker.internet.email(),
      emailVerified: faker.datatype.boolean(),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      role: 'owner',
      banExpires: null,
      banReason: null,
      banned: false,
      imageId: null,
    };

    const userEntity = UserEntity.fromModel(userModel);
    expect(userEntity.initials).toBe('JD');
  });

  it('should return a single initial based on the name', () => {
    const userModel: UserModel = {
      id: faker.string.uuid(),
      name: 'John',
      email: faker.internet.email(),
      emailVerified: faker.datatype.boolean(),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      role: 'owner',
      banExpires: null,
      banReason: null,
      banned: false,
      imageId: null,
    };

    const userEntity = UserEntity.fromModel(userModel);
    expect(userEntity.initials).toBe('J');
  });

  it('should return no initial if no name', () => {
    const userModel: UserModel = {
      id: faker.string.uuid(),
      name: '',
      email: faker.internet.email(),
      emailVerified: faker.datatype.boolean(),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      role: 'owner',
      banExpires: null,
      banReason: null,
      banned: false,
      imageId: null,
    };

    const userEntity = UserEntity.fromModel(userModel);
    expect(userEntity.initials).toBe('');
  });

  it('should have an avatarId and avatarUrl if an imageModel is provided', () => {
    const userId = faker.string.uuid();
    const imageId = faker.string.uuid();
    const imageModel: ImageModel = {
      id: imageId,
      assetId: faker.string.uuid(),
      width: faker.number.int({ min: 100, max: 1000 }),
      height: faker.number.int({ min: 100, max: 1000 }),
      ownerId: userId,
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
    };

    const userModel: UserModel = {
      id: faker.string.uuid(),
      name: 'John Doe',
      email: faker.internet.email(),
      emailVerified: faker.datatype.boolean(),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      role: 'owner',
      banExpires: null,
      banReason: null,
      banned: false,
      imageId: imageId,
    };

    const userEntity = UserEntity.fromModel(userModel, imageModel);
    expect(userEntity.avatarId).toBe(imageId);
    expect(userEntity.avatarUrl).toBe(`http://localhost:3001/media/${imageModel.assetId}`);
  });

  it('should update the avatar with new image entity', () => {
    const userId = faker.string.uuid();
    const imageId = faker.string.uuid();
    const image2Id = faker.string.uuid();
    const imageModel: ImageModel = {
      id: imageId,
      assetId: faker.string.uuid(),
      width: faker.number.int({ min: 100, max: 1000 }),
      height: faker.number.int({ min: 100, max: 1000 }),
      ownerId: userId,
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
    };

    const image2Model: ImageModel = {
      id: image2Id,
      assetId: faker.string.uuid(),
      width: faker.number.int({ min: 100, max: 1000 }),
      height: faker.number.int({ min: 100, max: 1000 }),
      ownerId: userId,
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
    };

    const userModel: UserModel = {
      id: faker.string.uuid(),
      name: 'John Doe',
      email: faker.internet.email(),
      emailVerified: faker.datatype.boolean(),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      role: 'owner',
      banExpires: null,
      banReason: null,
      banned: false,
      imageId: imageId,
    };

    const userEntity = UserEntity.fromModel(userModel, imageModel);
    expect(userEntity.avatarId).toBe(imageId);
    expect(userEntity.avatarUrl).toBe(`http://localhost:3001/media/${imageModel.assetId}`);
    userEntity.setAvatar(ImageEntity.fromModel(image2Model));
    expect(userEntity.avatarId).toBe(image2Id);
    expect(userEntity.avatarUrl).toBe(`http://localhost:3001/media/${image2Model.assetId}`);
  });

  it('should update the avatar with null', () => {
    const userId = faker.string.uuid();
    const imageId = faker.string.uuid();

    const imageModel: ImageModel = {
      id: imageId,
      assetId: faker.string.uuid(),
      width: faker.number.int({ min: 100, max: 1000 }),
      height: faker.number.int({ min: 100, max: 1000 }),
      ownerId: userId,
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
    };

    const userModel: UserModel = {
      id: faker.string.uuid(),
      name: 'John Doe',
      email: faker.internet.email(),
      emailVerified: faker.datatype.boolean(),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      role: 'owner',
      banExpires: null,
      banReason: null,
      banned: false,
      imageId: imageId,
    };

    const userEntity = UserEntity.fromModel(userModel, imageModel);
    expect(userEntity.avatarId).toBe(imageId);
    expect(userEntity.avatarUrl).toBe(`http://localhost:3001/media/${imageModel.assetId}`);
    userEntity.setAvatar(null);
    expect(userEntity.avatarId).toBeUndefined();
    expect(userEntity.avatarUrl).toBeUndefined();
  });
});

describe('UserSessionEntity', () => {
  it('should create a UserSessionEntity from a SessionModel', () => {
    const sessionModel: SessionModel = {
      id: faker.string.uuid(),
      userId: faker.string.uuid(),
      expiresAt: faker.date.future(),
      userAgent: faker.internet.userAgent(),
      ipAddress: faker.internet.ip(),
      token: faker.string.uuid(),
      activeOrganizationId: null,
      impersonatedBy: null,
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
    };

    const userSessionEntity = UserSessionEntity.fromModel(sessionModel);
    expect(userSessionEntity.id).toBe(sessionModel.id);
    expect(userSessionEntity.userId).toBe(sessionModel.userId);
    expect(userSessionEntity.createdAt).toEqual(sessionModel.createdAt);
  });
});
