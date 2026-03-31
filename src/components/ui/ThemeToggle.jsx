import { Sun, Moon } from 'lucide-react'
import { useAppStore } from '../../store'

export default function ThemeToggle({ size = 16, style = {} }) {
  const theme = useAppStore(s => s.theme)
  const toggleTheme = useAppStore(s => s.toggleTheme)

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      title={theme === 'dark' ? 'Ganti ke tema terang' : 'Ganti ke tema gelap'}
      aria-label="Toggle tema"
      style={style}
    >
      {theme === 'dark' ? <Sun size={size} /> : <Moon size={size} />}
    </button>
  )
}
