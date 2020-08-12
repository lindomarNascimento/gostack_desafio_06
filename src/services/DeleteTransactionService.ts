import { getCustomRepository } from 'typeorm';

import TransactionsRepository from '../repositories/TransactionsRepository';
import AppError from '../errors/AppError';

class DeleteTransactionService {
  public async execute(id: string): Promise<void> {
    const allTransactions = getCustomRepository(TransactionsRepository);

    const reposityDelete = await allTransactions.findOne(id);

    if (!reposityDelete) {
      throw new AppError('Repository id not found');
    }

    await allTransactions.remove(reposityDelete);
  }
}

export default DeleteTransactionService;
