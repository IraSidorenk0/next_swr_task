'use client';

import { useState } from 'react';
import { UserInfoProps } from '../types/interfaces';

export default function UserInfo({ user }: UserInfoProps) {

  return (
    <div className="card px-5 py-6 dark:bg-gray-800">
      <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center">
        👤 Author info
      </h3>
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-500 flex items-center justify-center text-white font-semibold">
          {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
            {user.displayName || user.email || 'Anonymous'}
          </p>
          <p className="text-sm text-blue-600 dark:text-blue-400">
            ID: {user.uid.slice(0, 8)}...
          </p>
          <p className="text-sm text-blue-600 dark:text-blue-400">
            Email: {user.email}
          </p>
        </div>
      </div>
    </div>
  );
}
