'use client'

import { ChevronRight } from 'lucide-react'

interface HeaderProps {
  title: string
  description?: string
  breadcrumbs?: { label: string; href?: string }[]
}

export function Header({ title, description, breadcrumbs }: HeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="px-8 py-6">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="flex items-center gap-2 mb-4 text-sm">
            {breadcrumbs.map((crumb, index) => (
              <div key={index} className="flex items-center gap-2">
                {crumb.href ? (
                  <a href={crumb.href} className="text-blue-600 hover:underline">
                    {crumb.label}
                  </a>
                ) : (
                  <span className="text-gray-600">{crumb.label}</span>
                )}
                {index < breadcrumbs.length - 1 && <ChevronRight className="w-4 h-4 text-gray-400" />}
              </div>
            ))}
          </div>
        )}

        {/* Title and description */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
          {description && <p className="mt-2 text-gray-600">{description}</p>}
        </div>
      </div>
    </div>
  )
}
