import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

export function makeQueryBuilder<T extends ObjectLiteral>(
  getOneResult: unknown,
): SelectQueryBuilder<T> {
  const qb = {
    select: jest.fn(),
    where: jest.fn(),
    innerJoinAndSelect: jest.fn(),
    setLock: jest.fn(),
    getOne: jest.fn().mockResolvedValue(getOneResult),
  };
  qb.select.mockReturnValue(qb);
  qb.where.mockReturnValue(qb);
  qb.innerJoinAndSelect.mockReturnValue(qb);
  qb.setLock.mockReturnValue(qb);
  return qb as unknown as SelectQueryBuilder<T>;
}
