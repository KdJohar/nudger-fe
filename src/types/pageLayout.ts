export interface PillTabItem<Value extends string = string> {
  title: string
  value: Value
  icon?: string
  disabled?: boolean
}

export interface PageMetadata {
  label: string
  icon?: string
}

export interface PageBadge {
  label: string
  icon?: string
  tone?: 'secondary' | 'success' | 'warning'
}

export interface PageAction {
  label: string
  icon?: string
  to: string
}

export interface PageDefinition {
  title: string
  description: string
  action?: PageAction
  badge?: PageBadge
}

export interface PageFilter {
  label: string
  items: PillTabItem[]
  modelValue: string
  onSelect: (value: string) => void
}

export interface PagePresentation {
  filter?: PageFilter
  metadata?: PageMetadata[]
  badge?: PageBadge
  badges?: PageBadge[]
}
