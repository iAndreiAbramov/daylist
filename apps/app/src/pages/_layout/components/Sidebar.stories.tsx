import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import { AppRoute } from '../../../lib/AppRoute';
import { Sidebar } from './Sidebar';

const meta = {
  title: 'Layout/Sidebar',
  component: Sidebar,
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

const router = (path: string): Story['decorators'] => [
  (Story) => (
    <MemoryRouter initialEntries={[path]}>
      <div className="flex h-screen">
        <Story />
      </div>
    </MemoryRouter>
  ),
];

export const TasksActive: Story = { decorators: router(AppRoute.Tasks()) };
export const NotesActive: Story = { decorators: router(AppRoute.Notes()) };
export const FinanceActive: Story = { decorators: router(AppRoute.Finance()) };
export const ProfileActive: Story = { decorators: router(AppRoute.Profile()) };
