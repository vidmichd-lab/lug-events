'use client'

interface CityFilterProps {
  cities: Array<{ id: string; name: string }>
  selectedCity: string
  onCityChange: (cityId: string) => void
}

export default function CityFilter({ cities, selectedCity, onCityChange }: CityFilterProps) {
  return (
    <select
      value={selectedCity}
      onChange={(e) => onCityChange(e.target.value)}
      className="input-field"
    >
      <option value="">Все города</option>
      {cities.map((city) => (
        <option key={city.id} value={city.id}>
          {city.name}
        </option>
      ))}
    </select>
  )
}

