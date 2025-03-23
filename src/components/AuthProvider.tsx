import { useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";
import { Skeleton } from "@/components/ui/skeleton";

interface AuthProviderProps {
  children: React.ReactNode;
}

const HeaderSkeleton = () => (
  <div className="flex justify-between items-center">
    <div className="flex flex-col gap-1">
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-3 w-40" />
    </div>
    <Skeleton className="h-8 w-32" />
  </div>
);

const ContentSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-12 md:gap-6 lg:gap-8 mt-4">
    {/* Left side skeleton */}
    <div className="md:col-span-5 lg:col-span-4 xl:col-span-4 md:pr-2">
      <Skeleton className="h-[calc(100vh-8rem)]" />
    </div>

    {/* Right side skeleton */}
    <div className="md:col-span-7 lg:col-span-8 xl:col-span-8 space-y-4 md:pl-2">
      <Skeleton className="h-32" />
      <Skeleton className="h-[400px]" />
    </div>
  </div>
);

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const { status, subscribeToAuthChanges, unsubscribeFromAuthChanges } = useAuthStore();

  useEffect(() => {
    // Set up auth state subscription when component mounts
    subscribeToAuthChanges();
    
    // Clean up subscription when component unmounts
    return () => {
      unsubscribeFromAuthChanges();
    };
  }, [subscribeToAuthChanges, unsubscribeFromAuthChanges]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-[1800px] mx-auto py-4 px-3 md:px-4 space-y-4">
          <HeaderSkeleton />
          <ContentSkeleton />
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
