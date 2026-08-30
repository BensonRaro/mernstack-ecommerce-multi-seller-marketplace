import { Link } from "react-router";
import { useUserProfile } from "@/hooks/use-user-profile";
import { AlertCircle, Star, User, Mail, Phone } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { toast } from "@/components/ui/toast";

export default function Settings() {
  const { data: profile, isLoading, isError, error } = useUserProfile();

  if (isLoading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-96 rounded-2xl" />
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/5] rounded-2xl" />
          ))}
        </div>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <Empty className="border py-16">
          <EmptyMedia variant="icon">
            <AlertCircle />
          </EmptyMedia>
          <EmptyTitle>Error loading profile</EmptyTitle>
          <EmptyDescription>{(error as Error)?.message || "Failed to load profile"}</EmptyDescription>
          <Button size="sm" className="rounded-full" render={<Link to="/" />}>
            Back to home
          </Button>
        </Empty>
      </main>
    );
  }

  return (
    <main className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-heading text-2xl font-bold tracking-tight">Settings</h1>
          <Link to="/profile" className="text-sm font-medium text-primary hover:text-foreground">
            Back to Profile
          </Link>
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base normal-case tracking-tight">
              <Avatar className="size-12">
                <AvatarImage src={profile?.image || undefined} alt={profile?.name} />
                <AvatarFallback className="text-lg font-semibold bg-muted">{profile?.name?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
              </Avatar>
              <span className="font-semibold">{profile?.name || "Unknown"}</span>
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">{profile?.email || ""}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mt-6 space-y-4">
              <div>
                <h2 className="font-heading text-sm font-semibold tracking-wider uppercase text-muted-foreground">Profile Information</h2>
                <p className="text-sm text-foreground">{profile?.name || "Not provided"}</p>
                <p className="text-xs text-muted-foreground">{profile?.email || "Not provided"}</p>
                {profile?.image && (
                  <p className="mt-2 text-sm text-muted-foreground">Image: {profile.image}</p>
                )}
              </div>

              <div>
                <h2 className="font-heading text-sm font-semibold tracking-wider uppercase text-muted-foreground">Address</h2>
                {profile?.defaultAddress ? (
                  <div className="rounded-2xl border border-border bg-card p-4">
                    <p className="font-medium">{profile.defaultAddress.street}</p>
                    <p className="text-xs text-muted-foreground">
                      {profile.defaultAddress.city} {profile.defaultAddress.zip}
                      {profile.defaultAddress.country}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No address saved</p>
                )}
              </div>

              <div>
                <h2 className="font-heading text-sm font-semibold tracking-wider uppercase text-muted-foreground">Phone Number</h2>
                {profile?.defaultPhone ? (
                  <div className="rounded-2xl border border-border bg-card p-4">
                    <p className="font-medium">{profile.defaultPhone.number}</p>
                    <p className="text-xs text-muted-foreground">Default phone number</p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No phone number saved</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}