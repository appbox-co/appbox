'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'

interface AppSearchProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  selectedCategory: string
  onCategoryChange: (value: string) => void
  categories: string[]
  appSlots: number | null
  onAppSlotsChange: (value: number | null) => void
  sortBy: string
  onSortChange: (value: any) => void
}

export function AppSearch({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  appSlots,
  onAppSlotsChange,
  sortBy,
  onSortChange,
}: AppSearchProps) {
  const t = useTranslations()
  const [localAppSlots, setLocalAppSlots] = useState(
    appSlots === null ? '' : appSlots.toString()
  )

  const handleAppSlotsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocalAppSlots(value)
    const numValue = value === '' ? null : parseInt(value)
    onAppSlotsChange(numValue)
  }

  const handleReset = () => {
    onSearchChange('')
    onCategoryChange('all')
    setLocalAppSlots('')
    onAppSlotsChange(null)
    onSortChange('name')
  }

  return (
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle>{t('apps.search.title')}</CardTitle>
        <CardDescription>{t('apps.search.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="search">{t('apps.search.name_search')}</Label>
          <Input
            id="search"
            placeholder={t('apps.search.name_placeholder')}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">{t('apps.search.category')}</Label>
          <Select value={selectedCategory} onValueChange={onCategoryChange}>
            <SelectTrigger id="category">
              <SelectValue placeholder={t('apps.search.all_categories')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t('apps.search.all_categories')}
              </SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="app-slots">{t('apps.search.app_slots')}</Label>
          <Input
            id="app-slots"
            type="number"
            min="1"
            placeholder={t('apps.search.app_slots_placeholder')}
            value={localAppSlots}
            onChange={handleAppSlotsChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sort-by">{t('apps.search.sort_by')}</Label>
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger id="sort-by">
              <SelectValue placeholder={t('apps.search.sort_name')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">{t('apps.search.sort_name')}</SelectItem>
              <SelectItem value="created_date">
                {t('apps.search.sort_date')}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" onClick={handleReset}>
          {t('apps.search.reset_filters')}
        </Button>
      </CardFooter>
    </Card>
  )
}
