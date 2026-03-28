import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Category,
  FinanceEntry,
  Note,
  Task,
  User,
} from '../../../typeorm/entities';
import { CategoryTypeEnum, FinanceEntryTypeEnum } from '@daylist/common/enums';
import { seedConfig, type SeedConfig } from '../../../lib/config/seed.config';

const SEED_USER_EMAIL = 'seed@daylist.dev';

const MOCK_DATA = {
  categories: [
    { name: 'Личное', type: CategoryTypeEnum.Task },
    { name: 'Работа', type: CategoryTypeEnum.Task },
    { name: 'Личное', type: CategoryTypeEnum.Note },
    { name: 'Общее', type: CategoryTypeEnum.Finance },
  ],

  tasks: {
    ['Личное']: [
      {
        title: 'Купить продукты',
        completed: false,
        subtasks: ['Молоко', 'Хлеб', 'Яйца'],
      },
      { title: 'Записаться к врачу', completed: true, subtasks: [] },
      { title: 'Разобрать шкаф', completed: false, subtasks: [] },
      { title: 'Позвонить родителям', completed: false, subtasks: [] },
    ],
    ['Работа']: [
      {
        title: 'Подготовить отчёт',
        completed: false,
        subtasks: [
          'Собрать данные',
          'Написать текст',
          'Согласовать с командой',
        ],
      },
      { title: 'Провести код-ревью', completed: false, subtasks: [] },
      { title: 'Обновить документацию', completed: true, subtasks: [] },
      { title: 'Настроить CI/CD', completed: false, subtasks: [] },
    ],
  },

  notes: [
    {
      title: 'Список книг',
      content:
        'The Pragmatic Programmer\nClean Code\nDesigning Data-Intensive Applications\nRefactoring by Martin Fowler',
    },
    {
      title: 'Идеи для путешествий',
      content:
        'Грузия — Тбилиси, Батуми\nАрмения — Ереван\nКиргизия — Бишкек, озеро Иссык-Куль',
    },
    {
      title: 'Рецепт пасты карбонара',
      content:
        '200г спагетти, 100г гуанчале, 2 яйца, 50г пармезана, чёрный перец.\nОбжарить гуанчале, смешать яйца с сыром, соединить с горячей пастой вне огня.',
    },
  ],

  financeEntries: [
    {
      amount: 120000,
      type: FinanceEntryTypeEnum.Income,
      description: 'Зарплата',
      daysAgo: 5,
    },
    {
      amount: 15000,
      type: FinanceEntryTypeEnum.Income,
      description: 'Фриланс-проект',
      daysAgo: 12,
    },
    {
      amount: 3200,
      type: FinanceEntryTypeEnum.Expense,
      description: 'Продукты',
      daysAgo: 1,
    },
    {
      amount: 1500,
      type: FinanceEntryTypeEnum.Expense,
      description: 'Транспорт',
      daysAgo: 2,
    },
    {
      amount: 2800,
      type: FinanceEntryTypeEnum.Expense,
      description: 'Ресторан',
      daysAgo: 4,
    },
    {
      amount: 8900,
      type: FinanceEntryTypeEnum.Expense,
      description: 'Коммунальные услуги',
      daysAgo: 7,
    },
    {
      amount: 4200,
      type: FinanceEntryTypeEnum.Expense,
      description: 'Одежда',
      daysAgo: 10,
    },
    {
      amount: 600,
      type: FinanceEntryTypeEnum.Expense,
      description: 'Кофе',
      daysAgo: 0,
    },
  ],
};

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @Inject(seedConfig.KEY)
    private readonly config: SeedConfig,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(Note)
    private readonly noteRepository: Repository<Note>,
    @InjectRepository(FinanceEntry)
    private readonly financeEntryRepository: Repository<FinanceEntry>,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!this.config.enabled) return;
    await this.seed();
  }

  private async seed(): Promise<void> {
    const existing = await this.userRepository.findOneBy({
      email: SEED_USER_EMAIL,
    });

    if (existing) {
      this.logger.log('Seed data already exists, skipping');
      return;
    }

    this.logger.log('Seeding mock data...');

    const user = await this.userRepository.save(
      this.userRepository.create({ email: SEED_USER_EMAIL }),
    );

    const categories = await this.categoryRepository.save(
      MOCK_DATA.categories.map((c, i) =>
        this.categoryRepository.create({
          userId: user.id,
          name: c.name,
          type: c.type,
          position: i,
        }),
      ),
    );

    await this.seedTasks(user.id, categories);
    await this.seedNotes(user.id, categories);
    await this.seedFinanceEntries(user.id, categories);

    this.logger.log(`Seed complete. Test user: ${SEED_USER_EMAIL}`);
  }

  private async seedTasks(
    userId: string,
    categories: Category[],
  ): Promise<void> {
    const taskCategories = categories.filter(
      (c) => c.type === CategoryTypeEnum.Task,
    );

    for (const category of taskCategories) {
      const mocks =
        MOCK_DATA.tasks[category.name as keyof typeof MOCK_DATA.tasks] ?? [];

      for (const [i, mock] of mocks.entries()) {
        const parent = await this.taskRepository.save(
          this.taskRepository.create({
            userId,
            categoryId: category.id,
            title: mock.title,
            completed: mock.completed,
            position: i,
          }),
        );

        if (mock.subtasks.length > 0) {
          await this.taskRepository.save(
            mock.subtasks.map((title, j) =>
              this.taskRepository.create({
                userId,
                categoryId: category.id,
                parentId: parent.id,
                title,
                completed: false,
                position: j,
              }),
            ),
          );
        }
      }
    }
  }

  private async seedNotes(
    userId: string,
    categories: Category[],
  ): Promise<void> {
    const noteCategory = categories.find(
      (c) => c.type === CategoryTypeEnum.Note,
    );
    if (!noteCategory) return;

    await this.noteRepository.save(
      MOCK_DATA.notes.map((n) =>
        this.noteRepository.create({
          userId,
          categoryId: noteCategory.id,
          title: n.title,
          content: n.content,
        }),
      ),
    );
  }

  private async seedFinanceEntries(
    userId: string,
    categories: Category[],
  ): Promise<void> {
    const financeCategory = categories.find(
      (c) => c.type === CategoryTypeEnum.Finance,
    );
    if (!financeCategory) return;

    const now = new Date();

    await this.financeEntryRepository.save(
      MOCK_DATA.financeEntries.map((e) => {
        const date = new Date(now);
        date.setDate(date.getDate() - e.daysAgo);
        return this.financeEntryRepository.create({
          userId,
          categoryId: financeCategory.id,
          amount: e.amount,
          type: e.type,
          description: e.description,
          date,
          currency: 'RUB',
        });
      }),
    );
  }
}
