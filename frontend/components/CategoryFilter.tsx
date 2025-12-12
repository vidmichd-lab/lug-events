'use client'

interface CategoryFilterProps {
  categories: Array<{ id: string; name: string }>
  selectedCategory: string
  onCategoryChange: (categoryId: string) => void
}

export default function CategoryFilter({
  categories,
  selectedCategory,
  onCategoryChange
}: CategoryFilterProps) {
  return (
    <select
      value={selectedCategory}
      onChange={(e) => onCategoryChange(e.target.value)}
      className="input-field"
    >
      <option value="">Все категории</option>
      {categories.map((category) => (
        <option key={category.id} value={category.id}>
          {category.name}
        </option>
      ))}
    </select>
  )
}

