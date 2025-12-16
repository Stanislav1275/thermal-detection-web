import {Activity} from 'lucide-react'
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
} from '@/components/ui/sidebar'
import {JobList} from '@/components/job-list/JobList'
import {useJobStore} from '@/store/jobStore'
import {cn} from '@/lib/utils'

export function AppSidebar() {
    const {currentJobId} = useJobStore()
    const {state} = useSidebar()
    const isCollapsed = state === 'collapsed'

    return (
        <Sidebar collapsible="icon" variant="inset" className="overflow-x-hidden">
            <SidebarHeader className="overflow-x-hidden min-w-0">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <a href="#" className="flex items-center gap-2 min-w-0">
                                <div
                                    className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground flex-shrink-0">
                                    <Activity className="size-4"/>
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
                                    <span className="truncate font-semibold">Thermal Detection</span>
                                    <span className="truncate text-xs text-sidebar-foreground/70">Детекция людей</span>
                                </div>
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent className="overflow-x-hidden min-w-0">
                <SidebarGroup className="min-w-0">
                    <SidebarGroupLabel>Задачи</SidebarGroupLabel>
                    <SidebarGroupContent className={cn("min-w-0 overflow-x-hidden", isCollapsed && "hidden")}>
                        <JobList/>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarRail/>
        </Sidebar>
    )
}

