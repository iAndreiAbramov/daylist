import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
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

export const TasksActive: Story = { decorators: router('/tasks') };
export const NotesActive: Story = { decorators: router('/notes') };
export const FinanceActive: Story = { decorators: router('/finance') };
export const ProfileActive: Story = { decorators: router('/profile') };
