"use client";

import { useEffect, useState } from "react";
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
  ChevronDown,
  ChevronRight,
} from "lucide-react";

// Navigation structure
const navigation = [
  { name: "Dashboard", icon: Home, current: true, href: "/" },
  {
    name: "Record",
    icon: BarChart3,
    current: false,
    isDropdown: true,
    children: [
      { name: "Record Breeding", icon: PawPrint, href: "/record/breeding" },
      { name: "Record Animal", icon: Heart, href: "/record/animals" },
      { name: "Record Milking", icon: TrendingUp, href: "/record/milking" },
    ],
  },
  { name: "Pregnancy", icon: Home, current: false, href: "/pregnancy" },

  {
    name: "Inventory",
    icon: FileText,
    current: false,
    isDropdown: true,
    children: [
      { name: "Animal Inventory", icon: PawPrint, href: "/inventory/animals" },
      {
        name: "Medicine Inventory",
        icon: Settings,
        href: "/inventory/medicine",
      },
    ],
  },
];

// Desktop Sidebar Component
export function DesktopSidebar() {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    {}
  );
  const [notifications, setNotifications] = useState([]);

  const toggleExpanded = (itemName: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemName]: !prev[itemName],
    }));
  };

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const response = await fetch("/api/notifications");
        const data = await response.json();
        setNotifications(data);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    }
    fetchNotifications();
  }, []);

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
              const isExpanded = !!expandedItems[item.name];

              return (
                <div key={item.name}>
                  {item.isDropdown ? (
                    <>
                      <button
                        onClick={() => toggleExpanded(item.name)}
                        className="w-full group flex items-center justify-between px-2 py-2 text-sm font-medium rounded-md transition-colors duration-150 ease-in-out text-muted-foreground hover:text-primary hover:bg-primary/10 cursor-pointer"
                      >
                        <div className="flex items-center">
                          <Icon className="mr-3 h-5 w-5 flex-shrink-0 transition-colors duration-150 group-hover:text-primary" />
                          <span className="truncate">{item.name}</span>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 transition-colors group-hover:text-primary" />
                        ) : (
                          <ChevronRight className="h-4 w-4 transition-colors group-hover:text-primary" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="ml-6 mt-1 space-y-1">
                          {item.children.map((child) => {
                            const ChildIcon = child.icon;
                            return (
                              <a
                                key={child.name}
                                href={child.href}
                                className="group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-150 ease-in-out text-muted-foreground hover:text-primary hover:bg-primary/10"
                              >
                                <ChildIcon className="mr-3 h-4 w-4 flex-shrink-0 transition-colors group-hover:text-primary" />
                                <span className="truncate">{child.name}</span>
                              </a>
                            );
                          })}
                        </div>
                      )}
                    </>
                  ) : (
                    <a
                      href={item.href}
                      className={`
                        group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-150 ease-in-out
                        ${
                          item.current
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                        }
                      `}
                    >
                      <Icon
                        className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors duration-150 ${
                          item.current
                            ? "text-primary-foreground"
                            : "group-hover:text-primary"
                        }`}
                      />
                      <span className="truncate">{item.name}</span>
                    </a>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
        <div className="flex-shrink-0 p-4 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Bell className="h-4 w-4 transition-colors group-hover:text-primary" />
            <span>{notifications.length} notifications</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Mobile Sidebar Component
export function MobileSidebar() {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    {}
  );
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const response = await fetch("/api/notifications");
        const data = await response.json();
        setNotifications(data);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    }
    fetchNotifications();
  }, []);

  const toggleExpanded = (itemName: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemName]: !prev[itemName],
    }));
  };

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
                const isExpanded = !!expandedItems[item.name];

                return (
                  <div key={item.name}>
                    {item.isDropdown ? (
                      <>
                        <button
                          onClick={() => toggleExpanded(item.name)}
                          className="w-full group flex items-center justify-between px-2 py-2 text-sm font-medium rounded-md transition-colors duration-150 ease-in-out text-muted-foreground hover:text-primary hover:bg-primary/10"
                        >
                          <div className="flex items-center">
                            <Icon className="mr-3 h-5 w-5 flex-shrink-0 transition-colors group-hover:text-primary" />
                            <span className="truncate">{item.name}</span>
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 transition-colors group-hover:text-primary" />
                          ) : (
                            <ChevronRight className="h-4 w-4 transition-colors group-hover:text-primary" />
                          )}
                        </button>
                        {isExpanded && (
                          <div className="ml-6 mt-1 space-y-1">
                            {item.children.map((child) => {
                              const ChildIcon = child.icon;
                              return (
                                <a
                                  key={child.name}
                                  href={child.href}
                                  className="group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-150 ease-in-out text-muted-foreground hover:text-primary hover:bg-primary/10"
                                >
                                  <ChildIcon className="mr-3 h-4 w-4 flex-shrink-0 transition-colors group-hover:text-primary" />
                                  <span className="truncate">{child.name}</span>
                                </a>
                              );
                            })}
                          </div>
                        )}
                      </>
                    ) : (
                      <a
                        href={item.href}
                        className={`
                          group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-150 ease-in-out
                          ${
                            item.current
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                          }
                        `}
                      >
                        <Icon
                          className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors duration-150 ${
                            item.current
                              ? "text-primary-foreground"
                              : "group-hover:text-primary"
                          }`}
                        />
                        <span className="truncate">{item.name}</span>
                      </a>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>
          <div className="flex-shrink-0 p-4 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Bell className="h-4 w-4 transition-colors group-hover:text-primary" />
              <span>{notifications.length} notifications</span>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
