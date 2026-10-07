export interface ChoiceCardItem<Value extends string = string> {
  value: Value
  title: string
  icon: string
  description?: string
  detail?: string
}
