import { Link } from "react-router-dom";
import { PlusCircle, MessageCircle, LogOut, LayoutDashboard, User, Shield, BarChart3, CheckCircle, Users, FileEdit, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { OnlineCounter } from "@/components/OnlineCounter";

export function Header() {
  const { user, signOut, loading } = useAuth();
  const { isAdmin, isModerator, canApproveAds } = useUserRole();

  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "کاربر";
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-md">
              <MessageCircle className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">گپ‌گرام</span>
          </Link>
          <OnlineCounter />
        </div>

        <div className="flex items-center gap-3">
          {!loading && (
            <>
              {user ? (
                <>
                  <Button asChild className="gap-2 shadow-md">
                    <Link to="/submit-ad">
                      <PlusCircle className="h-5 w-5" />
                      <span className="hidden sm:inline">ثبت آگهی</span>
                    </Link>
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                        <Avatar className="h-9 w-9">
                          {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end">
                      <div className="flex items-center gap-2 p-2">
                        <Avatar className="h-8 w-8">
                          {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{displayName}</span>
                          <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                            {user.email}
                          </span>
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild className="cursor-pointer">
                        <Link to="/dashboard">
                          <LayoutDashboard className="ml-2 h-4 w-4" />
                          پنل کاربری
                        </Link>
                      </DropdownMenuItem>
                      
                      {/* Admin/Moderator Options */}
                      {canApproveAds && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild className="cursor-pointer">
                            <Link to="/admin">
                              <CheckCircle className="ml-2 h-4 w-4" />
                              تأیید آگهی‌ها
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className="cursor-pointer">
                            <Link to="/manage-ads">
                              <FileEdit className="ml-2 h-4 w-4" />
                              مدیریت آگهی‌ها
                            </Link>
                          </DropdownMenuItem>
                        </>
                      )}
                      
                      {isAdmin && (
                        <>
                          <DropdownMenuItem asChild className="cursor-pointer">
                            <Link to="/analytics">
                              <BarChart3 className="ml-2 h-4 w-4" />
                              آمار و تحلیل
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className="cursor-pointer">
                            <Link to="/manage-roles">
                              <Users className="ml-2 h-4 w-4" />
                              مدیریت نقش‌ها
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className="cursor-pointer">
                            <Link to="/telegram-scraper">
                              <RefreshCw className="ml-2 h-4 w-4" />
                              استخراج از تلگرام
                            </Link>
                          </DropdownMenuItem>
                        </>
                      )}
                      
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={signOut} className="text-destructive cursor-pointer">
                        <LogOut className="ml-2 h-4 w-4" />
                        خروج
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <Button asChild variant="default" className="gap-2">
                  <Link to="/auth">
                    <User className="h-4 w-4" />
                    ورود / ثبت‌نام
                  </Link>
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}