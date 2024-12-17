import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  HomeIcon,
  BoltIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

const navItems = [
  { name: 'Orders', href: '/orders', icon: ClipboardDocumentListIcon },
  { name: 'Session History', href: '/sessions', icon: ClockIcon },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 min-h-screen bg-gray-900 border-r border-gray-800">
      <div className="flex flex-col h-full">
        {/* Company Logo */}
        <div className="p-6 border-b border-gray-800">
          <div className="space-y-1">
            <h1 className="text-lg font-semibold bg-gradient-to-r from-blue-400 to-blue-600 text-transparent bg-clip-text">
              Krones Order Tracking
            </h1>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <p className="text-sm text-gray-400">Station 42</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`relative flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                      isActive
                        ? 'text-white bg-blue-600'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="active-nav"
                        className="absolute inset-0 bg-blue-600 rounded-lg"
                        initial={false}
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 35
                        }}
                      />
                    )}
                    <item.icon
                      className={`w-5 h-5 relative z-10 transition-transform group-hover:scale-110 ${
                        isActive ? 'text-white' : 'text-gray-400'
                      }`}
                    />
                    <span className="relative z-10">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800">
          <div className="px-4 py-3 rounded-lg bg-gray-800/50">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">K</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-white">Krones AG</p>
                <p className="text-xs text-gray-400">Production Monitoring</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 