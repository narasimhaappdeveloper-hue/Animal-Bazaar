'use client';

import { useAuth } from '@/context/auth-context';
import { animals } from '@/lib/animals';
import ProfileClient from '@/components/profile-client';
import { useMemo } from 'react';

export default function ProfilePage() {
    const { user } = useAuth();
    const myUploads = useMemo(() => {
        if (!user) return [];
        return animals.filter(animal => animal.uid === user.uid);
    }, [user]);

    return <ProfileClient myUploads={myUploads} />;
}
