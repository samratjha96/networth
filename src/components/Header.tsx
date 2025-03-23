import { useAuthStore } from "@/store/auth-store";
import { AuthDialog } from "./AuthDialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export const Header = () => {
  const { user, signOut } = useAuthStore();

  // Get initials for avatar
  const getInitials = () => {
    if (!user?.user_metadata?.full_name) {
      return user?.email?.charAt(0).toUpperCase() || "U";
    }

    const fullName = user.user_metadata.full_name as string;
    const names = fullName.split(" ");
    return names.map((name) => name.charAt(0).toUpperCase()).join("");
  };

  return (
    <div className="flex justify-between items-center">
      <div className="flex flex-col">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          Argos
        </h1>
        <p className="text-xs text-muted-foreground">
          Your all-seeing financial guardian
        </p>
      </div>

      <div className="flex items-center gap-4">
        {!user ? (
          <div className="flex flex-row items-end gap-2">
            <div className="px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-700 font-medium text-xs flex items-center gap-1.5 animate-pulse">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
              Demo Mode
            </div>

            <AuthDialog
              trigger={
                <button className="px-4 py-1.5 rounded-full text-xs border border-slate-200 hover:border-slate-300 font-medium flex items-center gap-1.5 transition-colors">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-primary"
                  >
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                    <polyline points="10 17 15 12 10 7" />
                    <line x1="15" y1="12" x2="3" y2="12" />
                  </svg>
                  <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    Sign in
                  </span>
                </button>
              }
            />
          </div>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-muted transition-colors">
                <span className="text-sm font-medium">
                  {user.user_metadata?.full_name || user.email}
                </span>
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="text-sm">Profile</DropdownMenuItem>
              <DropdownMenuItem className="text-sm">Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-sm text-red-500 focus:text-red-500"
                onClick={signOut}
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
};
