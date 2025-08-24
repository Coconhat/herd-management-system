"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Menu,
  Home,
  PawPrint,
  BarChart3,
  Settings,
  Bell,
  FileText,
  Heart,
  TrendingUp,
} from "lucide-react";

// Sidebar Navigation Items
const navigation = [
  { name: "Dashboard", icon: Home, current: true, href: "/" },
  { name: "Animals", icon: PawPrint, current: false, href: "/animals" },
  { name: "Reports", icon: BarChart3, current: false, href: "/reports" },
  { name: "Health", icon: Heart, current: false, href: "/health" },
  { name: "Breeding", icon: TrendingUp, current: false, href: "/breeding" },
  { name: "Documents", icon: FileText, current: false, href: "/documents" },
  { name: "Settings", icon: Settings, current: false, href: "/settings" },
];

// Desktop Sidebar Component
export function DesktopSidebar() {
  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
      <div className="flex flex-col flex-grow pt-5 bg-card border-r overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          <PawPrint className="h-8 w-8 text-primary" />
          <h2 className="ml-2 text-lg font-semibold text-foreground">
            D.H Magpantay
          </h2>
        </div>
        <div className="mt-8 flex-grow flex flex-col">
          <nav className="flex-1 px-2 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={`
                    group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors
                    ${
                      item.current
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }
                  `}
                >
                  <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {item.name}
                </a>
              );
            })}
          </nav>
        </div>
        <div className="flex-shrink-0 p-4 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Bell className="h-4 w-4" />
            <span>3 notifications</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Mobile Sidebar Component
export function MobileSidebar() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="flex flex-col h-full">
          <div className="flex items-center flex-shrink-0 px-4 py-5 border-b">
            <PawPrint className="h-8 w-8 text-primary" />
            <h2 className="ml-2 text-lg font-semibold text-foreground">
              D.H Magpantay
            </h2>
          </div>
          <div className="flex-1 py-4">
            <nav className="px-2 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    className={`
                      group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors
                      ${
                        item.current
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }
                    `}
                  >
                    <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    {item.name}
                  </a>
                );
              })}
            </nav>
          </div>
          <div className="flex-shrink-0 p-4 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Bell className="h-4 w-4" />
              <span>3 notifications</span>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
