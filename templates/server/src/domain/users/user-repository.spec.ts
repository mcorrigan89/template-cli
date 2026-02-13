import { UserContext } from '@/lib/context.ts';
import { faker } from '@faker-js/faker';
import { Database } from '@template/database';
import { describe, expect, it, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { ImageModel } from '../media/image-entity.ts';
import { UserModel } from './user-entity.ts';
import { UserRepository } from './user-repository.ts';

const contextMock = mockDeep<UserContext>();

describe('UserRepository', () => {
  it('should get a user by id', async () => {
    const userId = faker.string.uuid();
    const userName = faker.person.fullName();
    const userModel: UserModel = {
      id: userId,
      name: userName,
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

    const databaseMock = mockDeep<Database>({
      fallbackMockImplementation: () => ({
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnValueOnce([{ user: userModel, image: null }]),
      }),
    });

    const userRepository = new UserRepository(databaseMock);
    const user = await userRepository.userById(contextMock, {
      id: userId,
    });

    expect(user?.id).toBe(userId);
    expect(user?.name).toBe(userName);
  });

  it('should get a user by id with avatar', async () => {
    const userId = faker.string.uuid();
    const userName = faker.person.fullName();
    const imageId = faker.string.uuid();
    const imageAssetId = faker.string.uuid();
    const userModel: UserModel = {
      id: userId,
      name: userName,
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
    const imageModel: ImageModel = {
      id: imageId,
      assetId: imageAssetId,
      height: faker.number.int({ min: 100, max: 1000 }),
      width: faker.number.int({ min: 100, max: 1000 }),
      ownerId: userId,
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
    };

    const databaseMock = mockDeep<Database>({
      fallbackMockImplementation: () => ({
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnValueOnce([{ user: userModel, image: imageModel }]),
      }),
    });

    const userRepository = new UserRepository(databaseMock);
    const user = await userRepository.userById(contextMock, {
      id: userId,
    });

    expect(user?.id).toBe(userId);
    expect(user?.name).toBe(userName);
    expect(user?.avatarId).toBe(imageId);
  });
});
