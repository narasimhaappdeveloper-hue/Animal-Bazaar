'use client';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import MyUploads from '@/components/my-uploads';
import type { Animal } from '@/lib/definitions';
import { Mail, Phone, User, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ProfileClient({ myUploads }: { myUploads: Animal[] }) {
    const { user, logout, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading || !user) {
        return <div className="text-center">Loading profile...</div>;
    }

    return (
        <Tabs defaultValue="uploads" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="uploads">My Uploads</TabsTrigger>
                <TabsTrigger value="profile">Profile</TabsTrigger>
            </TabsList>
            <TabsContent value="uploads" className="mt-4">
                <MyUploads myUploads={myUploads} />
            </TabsContent>
            <TabsContent value="profile" className="mt-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Your Profile</CardTitle>
                        <CardDescription>This is your personal information.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16">
                                <AvatarImage src={`https://avatar.vercel.sh/${user.email}.png`} alt={user.name} />
                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <h3 className="text-lg font-semibold flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /> {user.name}</h3>
                                {user.email ? (
                                  <p className="text-sm text-muted-foreground flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> {user.email}</p>
                                ) : null}
                                <p className="text-sm text-muted-foreground flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> {user.phone}</p>
                                {(user.location || user.state || user.village) ? (
                                  <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                                    <span className="text-xs bg-muted px-2 py-0.5 rounded">
                                      {[user.village, user.location, user.state, user.pincode].filter(Boolean).join(', ')}
                                    </span>
                                  </p>
                                ) : null}
                            </div>
                        </div>
                        <Button variant="outline" onClick={logout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            Logout
                        </Button>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}
