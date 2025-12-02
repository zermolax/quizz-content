'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, Settings, FileUp, Sparkles, CheckSquare, Upload } from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  description: string
}

const navItems: NavItem[] = [
  {
    href: '/',
    label: 'Dashboard',
    icon: <BookOpen className="w-5 h-5" />,
    description: 'Vedere de ansamblu',
  },
  {
    href: '/documents',
    label: 'Documente',
    icon: <FileUp className="w-5 h-5" />,
    description: 'Gestiune PDF-uri',
  },
  {
    href: '/generate',
    label: 'Generare',
    icon: <Sparkles className="w-5 h-5" />,
    description: 'Creează întrebări',
  },
  {
    href: '/review',
    label: 'Review',
    icon: <CheckSquare className="w-5 h-5" />,
    description: 'Validare și editare',
  },
  {
    href: '/import',
    label: 'Import',
    icon: <Upload className="w-5 h-5" />,
    description: 'Salvare în Firestore',
  },
  {
    href: '/settings',
    label: 'Setări',
    icon: <Settings className="w-5 h-5" />,
    description: 'Configurare API',
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      {/* Logo/Header */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-lg">
            QF
          </div>
          <div>
            <h1 className="font-bold text-lg">QuizFun</h1>
            <p className="text-xs text-gray-400">Content Manager</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/')
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                  title={item.description}
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-3 py-6 border-t border-gray-800">
        <p className="text-xs text-gray-500 px-4">
          QuizFun Content Manager v0.1.0
        </p>
      </div>
    </aside>
  )
}
