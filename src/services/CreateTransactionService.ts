import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';

import TransactionsRepository from '../repositories/TransactionsRepository';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const createTransactions = getCustomRepository(TransactionsRepository);
    const createCategory = getRepository(Category);

    const { total } = await createTransactions.getBalance();

    if (type === 'outcome' && total < value) {
      throw new AppError('You dont have all that balance in account');
    }

    let repositoryCategory = await createCategory.findOne({
      where: { title: category },
    });

    if (!repositoryCategory) {
      repositoryCategory = createCategory.create({
        title: category,
      });

      await createCategory.save(repositoryCategory);
    }

    const transaction = createTransactions.create({
      title,
      value,
      type,
      category: repositoryCategory,
    });

    await createTransactions.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
