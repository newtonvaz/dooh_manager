import {
  LayoutDashboard,
  Monitor,
  Users,
  FileImage,
  ListVideo,
  Calendar,
  Grid3x3,
  BarChart3,
  Settings,
  Tags,
  AppWindow,
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  children?: { title: string; href: string; icon: LucideIcon }[]
}

export const navItems: NavItem[] = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  {
    title: "Players",
    href: "/players",
    icon: Monitor,
    children: [{ title: "Grupos", href: "/groups", icon: Users }],
  },
  {
    title: "Conteúdos",
    href: "/content",
    icon: FileImage,
    children: [{ title: "Categorias", href: "/categories", icon: Tags }],
  },
  { title: "Playlists", href: "/playlists", icon: ListVideo },
  { title: "Programação", href: "/scheduling", icon: Calendar },
  { title: "Layouts", href: "/layouts", icon: Grid3x3 },
  { title: "Relatórios", href: "/reports", icon: BarChart3 },
  { title: "Apps", href: "/apps", icon: AppWindow },
  { title: "Configurações", href: "/settings", icon: Settings },
]
