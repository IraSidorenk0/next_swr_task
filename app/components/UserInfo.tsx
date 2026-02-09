'use client';

import { UserInfoProps } from '../types/interfaces';

export default function UserInfo({ user }: UserInfoProps) {
  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
      <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center">
        👤 Author info
      </h3>
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
          {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
            {user.displayName || user.email || 'Anonymous'}
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400">
            ID: {user.uid.slice(0, 8)}...
          </p>
        </div>
      </div>
    </div>
  );
}
