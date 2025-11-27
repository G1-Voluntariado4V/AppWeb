/**
* Interfaz para un elemento de la barra lateral (sidebar).
*/
export interface SidebarItem {
  label: string;
  icon?: string;
  route?: string;
  children?: SidebarItem[];
  expanded?: boolean;
}
