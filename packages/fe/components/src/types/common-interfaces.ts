import type { RouteObject } from 'react-router-dom';
import type { ReactNode } from 'react';

export type HttpCodesInterface = readonly number[];
export type CssBreakPointsInterface = readonly string[];

export type CustomRouteObject = RouteObject & {
  label?: string;
  isNav?: boolean;
  isEnd?: boolean;
  isIndex?: boolean;
  title: string;
  icon?: ReactNode;
};

export interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon?: React.ReactNode;
}

export interface UserMenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

export interface SidebarProps {
  routes?: CustomRouteObject[];
  userMenuItems?: UserMenuItem[];
}
