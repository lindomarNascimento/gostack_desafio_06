import { Router } from 'express';
import multer from 'multer';

import { getCustomRepository } from 'typeorm';

import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateTransactionService from '../services/CreateTransactionService';
import DeleteTransactionService from '../services/DeleteTransactionService';
import ImportTransactionsService from '../services/ImportTransactionsService';

import uploadConfigCSV from '../config/uploadCSV';

const uploadCSV = multer(uploadConfigCSV);

const transactionsRouter = Router();

transactionsRouter.get('/', async (request, response) => {
  const transactionRepository = getCustomRepository(TransactionsRepository);

  const transactions = await transactionRepository.find();

  const balance = await transactionRepository.getBalance();

  return response.json({ transactions, balance });
});

transactionsRouter.post('/', async (request, response) => {
  const { title, type, value, category } = request.body;

  const createTransactionService = new CreateTransactionService();

  const transaction = await createTransactionService.execute({
    title,
    type,
    value,
    category,
  });

  return response.json(transaction);
});

transactionsRouter.delete('/:id', async (request, response) => {
  const { id } = request.params;

  const deleteReposity = new DeleteTransactionService();

  await deleteReposity.execute(id);

  return response.status(204).send();
});

transactionsRouter.post(
  '/import',
  uploadCSV.single('file'),
  async (request, response) => {
    const importTransactions = new ImportTransactionsService();

    const upload = await importTransactions.execute(request.file.path);

    return response.json(upload);
  },
);

export default transactionsRouter;
