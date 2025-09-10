"use client";

import * as React from "react";
import {
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  PlusCircle,
  BarChart3,
  Archive,
  Milk,
  Boxes,
  HeartPulse,
  LayoutDashboard,
  Settings,
  Shield,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";

// This is our new, custom data structure for the sidebar navigation.
const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    label: "Records",
    icon: <ClipboardList className="h-4 w-4" />,
    // Items with `children` will be rendered as collapsible groups.
    children: [
      {
        label: "Record Calving",
        href: "#", // Replace with your actual route e.g., "/records/calving"
        icon: <PlusCircle className="h-4 w-4" />,
      },
      {
        label: "Record Pregnancy",
        href: "#", // Replace with your actual route e.g., "/records/pregnancy"
        icon: <HeartPulse className="h-4 w-4" />,
      },
    ],
  },
  {
    label: "Milking",
    href: "#", // Replace with your actual route e.g., "/milking"
    icon: <Milk className="h-4 w-4" />,
  },
  {
    label: "Inventory",
    icon: <Archive className="h-4 w-4" />,
    children: [
      {
        label: "Animal Inventory",
        href: "#", // Replace with your actual route e.g., "/inventory/animals"
        icon: <Boxes className="h-4 w-4" />,
        isActive: true, // Example of setting an active item
      },
      {
        label: "Medicine Inventory",
        href: "#", // Replace with your actual route e.g., "/inventory/medicine"
        icon: <BarChart3 className="h-4 w-4" />,
      },
    ],
  },
  {
    label: "Admin",
    icon: <Settings className="h-4 w-4" />,
    children: [
      {
        label: "Email Whitelist",
        href: "/admin/email-whitelist",
        icon: <Shield className="h-4 w-4" />,
      },
    ],
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { isCollapsed, setCollapsed } = useSidebar();

  return (
    <Sidebar {...props}>
      <SidebarHeader className="flex h-16 items-center justify-between p-4">
        <h1
          className="text-lg font-semibold transition-all duration-300 ease-in-out"
          style={{ opacity: isCollapsed ? 0 : 1 }}
        >
          Herd MS
        </h1>
        {/* Toggle button to collapse/expand the sidebar */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ChevronsRight /> : <ChevronsLeft />}
          <span className="sr-only">Toggle sidebar</span>
        </Button>
      </SidebarHeader>

      <Separator />

      <SidebarContent>
        {/* We map over our custom navigation items */}
        {navItems.map((item) =>
          // If the item has children, create a collapsible group.
          item.children ? (
            <SidebarGroup key={item.label}>
              <SidebarGroupLabel className="flex items-center gap-2">
                {item.icon}
                <span>{item.label}</span>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {item.children.map((child) => (
                    <SidebarMenuItem key={child.label}>
                      <SidebarMenuButton asChild isActive={child.isActive}>
                        <a
                          href={child.href}
                          className="flex items-center gap-2"
                        >
                          {child.icon}
                          <span>{child.label}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ) : (
            // Otherwise, create a single, non-collapsible menu item.
            <SidebarMenu key={item.label}>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href={item.href} className="flex items-center gap-2">
                    {item.icon}
                    <span>{item.label}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          )
        )}
      </SidebarContent>
      {/* The SidebarRail is for a secondary, minimal sidebar, which you can use or remove */}
      {/* <SidebarRail /> */}
    </Sidebar>
  );
}
