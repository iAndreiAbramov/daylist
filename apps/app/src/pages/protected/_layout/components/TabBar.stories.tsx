import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
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

export const TasksActive: Story = { decorators: router('/tasks') };
export const NotesActive: Story = { decorators: router('/notes') };
export const FinanceActive: Story = { decorators: router('/finance') };
export const ProfileActive: Story = { decorators: router('/profile') };
