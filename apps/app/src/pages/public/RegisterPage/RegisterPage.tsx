import { AppRoute } from '@/lib/AppRoute';
import clsx from 'clsx';
import React from 'react';
import { Link } from 'react-router-dom';

export const RegisterPage: React.FC = () => {
  return (
    <div
      className={clsx(
        'flex items-center justify-center',
        'min-h-svh px-4',
        'bg-background',
      )}
    >
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-foreground text-2xl font-semibold">Daylist</h1>
          <p className="text-muted-foreground mt-2 text-sm">Создайте аккаунт</p>
        </div>
        <div className={clsx('rounded-lg border p-6', 'border-border bg-card')}>
          <p className="text-muted-foreground text-center text-sm">
            Форма регистрации — этап 6
          </p>
        </div>
        <p className="text-muted-foreground text-center text-sm">
          Уже есть аккаунт?{' '}
          <Link
            to={AppRoute.Login()}
            className="text-foreground hover:text-primary underline underline-offset-4"
          >
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
};
