import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import { AppRoute } from '../../../lib/AppRoute';
import { TabBar } from './TabBar';

const meta = {
  title: 'Layout/TabBar',
  component: TabBar,
} satisfies Meta<typeof TabBar>;

export default meta;
type Story = StoryObj<typeof meta>;

const router = (path: string): Story['decorators'] => [
  (Story) => (
    <MemoryRouter initialEntries={[path]}>
      <div className="relative h-screen w-[375px]">
        <Story />
      </div>
    </MemoryRouter>
  ),
];

export const TasksActive: Story = { decorators: router(AppRoute.Tasks()) };
export const NotesActive: Story = { decorators: router(AppRoute.Notes()) };
export const FinanceActive: Story = { decorators: router(AppRoute.Finance()) };
export const ProfileActive: Story = { decorators: router(AppRoute.Profile()) };
