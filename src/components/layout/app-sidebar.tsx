"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    useSidebar,
} from "@/components/ui/sidebar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    BarChart3,
    ShoppingCart,
    Users,
    Settings,
    UserCog,
    Target,
    UserCheck,
    Percent,
    LogOut,
    ChevronUp,
    PanelLeftClose,
    PanelLeftOpen,
} from "lucide-react";
import type { Profile } from "@/lib/types/database";
import { ROLES } from "@/lib/utils";

const mainNav = [
    { title: "Dashboard", href: "/", icon: BarChart3 },
    { title: "Vendas", href: "/vendas", icon: ShoppingCart },
    { title: "Clientes", href: "/clientes", icon: Users },
];

const adminNav = [
    { title: "Usuários", href: "/admin/usuarios", icon: UserCog },
    { title: "Metas", href: "/admin/metas", icon: Target },
    { title: "Equipe", href: "/admin/equipe", icon: UserCheck },
    { title: "Regras de Comissão", href: "/admin/comissao", icon: Percent },
];

interface AppSidebarProps {
    profile: Profile | null;
}

export function AppSidebar({ profile }: AppSidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { state, toggleSidebar } = useSidebar();
    const isAdmin = profile?.role === "admin";
    const isCollapsed = state === "collapsed";

    async function handleLogout() {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    }

    const initials = profile?.nome
        ? profile.nome
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()
        : "??";

    return (
        <Sidebar collapsible="icon" className="border-r border-sidebar-border">
            <SidebarHeader className="p-4">
                <Link href="/" className="flex items-center gap-3 group">
                    {isCollapsed ? (
                        <Image
                            src="/icon.png"
                            alt="Layer"
                            width={32}
                            height={32}
                            className="shrink-0 rounded-sm transition-transform group-hover:scale-105"
                        />
                    ) : (
                        <Image
                            src="/LOGO-LAYER.webp"
                            alt="Layer Comercial"
                            width={160}
                            height={36}
                            className="h-9 w-auto object-contain"
                        />
                    )}
                </Link>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Menu</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {mainNav.map((item) => (
                                <SidebarMenuItem key={item.href}>
                                    <TooltipProvider delayDuration={0}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <SidebarMenuButton
                                                    asChild
                                                    isActive={
                                                        item.href === "/"
                                                            ? pathname === "/"
                                                            : pathname.startsWith(item.href)
                                                    }
                                                >
                                                    <Link href={item.href}>
                                                        <item.icon className="w-4 h-4" />
                                                        <span>{item.title}</span>
                                                    </Link>
                                                </SidebarMenuButton>
                                            </TooltipTrigger>
                                            {isCollapsed && (
                                                <TooltipContent side="right">{item.title}</TooltipContent>
                                            )}
                                        </Tooltip>
                                    </TooltipProvider>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {isAdmin && (
                    <SidebarGroup>
                        <SidebarGroupLabel>Administração</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {isCollapsed ? (
                                    // Collapsed: show admin items as flat icon buttons
                                    adminNav.map((item) => (
                                        <SidebarMenuItem key={item.href}>
                                            <TooltipProvider delayDuration={0}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <SidebarMenuButton
                                                            asChild
                                                            isActive={pathname.startsWith(item.href)}
                                                        >
                                                            <Link href={item.href}>
                                                                <item.icon className="w-4 h-4" />
                                                                <span>{item.title}</span>
                                                            </Link>
                                                        </SidebarMenuButton>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="right">{item.title}</TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </SidebarMenuItem>
                                    ))
                                ) : (
                                    // Expanded: show admin items as sub-menu
                                    <SidebarMenuItem>
                                        <SidebarMenuButton>
                                            <Settings className="w-4 h-4" />
                                            <span>Admin</span>
                                        </SidebarMenuButton>
                                        <SidebarMenuSub>
                                            {adminNav.map((item) => (
                                                <SidebarMenuSubItem key={item.href}>
                                                    <SidebarMenuSubButton
                                                        asChild
                                                        isActive={pathname.startsWith(item.href)}
                                                    >
                                                        <Link href={item.href}>
                                                            <item.icon className="w-3.5 h-3.5" />
                                                            <span>{item.title}</span>
                                                        </Link>
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                            ))}
                                        </SidebarMenuSub>
                                    </SidebarMenuItem>
                                )}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}
            </SidebarContent>

            <SidebarFooter className="p-2 space-y-1">
                {/* Toggle button */}
                <button
                    onClick={toggleSidebar}
                    className="w-full flex items-center justify-center gap-2 h-9 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
                >
                    {isCollapsed ? (
                        <PanelLeftOpen className="w-4 h-4 shrink-0" />
                    ) : (
                        <>
                            <PanelLeftClose className="w-4 h-4 shrink-0" />
                            <span>Recolher</span>
                        </>
                    )}
                </button>

                {/* User menu */}
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton className="w-full h-auto py-2">
                                    <Avatar className="w-8 h-8 shrink-0">
                                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs font-semibold">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                    {!isCollapsed && (
                                        <>
                                            <div className="flex-1 text-left">
                                                <p className="text-sm font-medium truncate">{profile?.nome}</p>
                                                <Badge
                                                    className={`text-[10px] px-1.5 py-0 h-4 text-white ${ROLES.find((r) => r.value === profile?.role)?.color || "bg-gray-500"}`}
                                                >
                                                    {ROLES.find((r) => r.value === profile?.role)?.label || profile?.role}
                                                </Badge>
                                            </div>
                                            <ChevronUp className="w-4 h-4" />
                                        </>
                                    )}
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent side={isCollapsed ? "right" : "top"} className="w-56">
                                <DropdownMenuItem
                                    onClick={handleLogout}
                                    className="text-red-600 focus:text-red-600"
                                >
                                    <LogOut className="mr-2 w-4 h-4" />
                                    Sair do sistema
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
