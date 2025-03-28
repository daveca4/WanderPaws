import { Menu } from '@headlessui/react';
import Link from 'next/link';

export function UserProfileMenuItem() {
  return (
    <Menu.Item>
      <Link
        href="/profile"
        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
      >
        Your Profile
      </Link>
    </Menu.Item>
  );
} 