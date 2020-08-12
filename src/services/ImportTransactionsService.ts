import csvParse from 'csv-parse';
import fs from 'fs';
import { getCustomRepository, getRepository, In } from 'typeorm';

import TransactionsRepository from '../repositories/TransactionsRepository';

import Category from '../models/Category';
import Transaction from '../models/Transaction';

interface TransactionCSV {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    const allTransactionsDB = getCustomRepository(TransactionsRepository);
    const allCategoriesDB = getRepository(Category);

    const createReadStream = fs.createReadStream(filePath);

    const configCSVParse = csvParse({
      delimiter: ',',
      from_line: 2,
    });

    const linesCSV = createReadStream.pipe(configCSVParse);

    const allTransactions: TransactionCSV[] = [];
    const allCategories: string[] = [];

    linesCSV.on('data', async line => {
      const [title, type, value, category] = line.map((el: string) =>
        el.trim(),
      );

      if (!title || !type || !value) return '';

      const transaction = { title, type, value, category };

      allTransactions.push(transaction);
      allCategories.push(category);
    });

    await new Promise(resolve => linesCSV.on('end', resolve));

    const existentCategories = await allCategoriesDB.find({
      where: {
        title: In(allCategories),
      },
    });

    const titleCategoriesExistent = existentCategories.map(
      (cateegory: Category) => cateegory.title,
    );

    const addCategoryTitles = allCategories
      .filter(category => !titleCategoriesExistent.includes(category))
      .filter((value, index, array) => array.indexOf(value) === index);
    console.log(addCategoryTitles);

    const newInsertToDB = allCategoriesDB.create(
      addCategoryTitles.map(title => ({
        title,
      })),
    );

    await allCategoriesDB.save(newInsertToDB);

    const categories = [...newInsertToDB, ...existentCategories];

    const createdTransactions = allTransactionsDB.create(
      allTransactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: categories.find(
          category => category.title === transaction.category,
        ),
      })),
    );

    await allTransactionsDB.save(createdTransactions);

    await fs.promises.unlink(filePath);

    return createdTransactions;
  }
}

export default ImportTransactionsService;
