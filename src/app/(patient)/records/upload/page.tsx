'use client';

import React from 'react';
import { RecordUpload } from '@/components/patient/RecordUpload';
import { useRouter } from 'next/navigation';
import { PageLayout } from '@/components/layout/PageLayout';

export default function UploadRecordPage() {
    const router = useRouter();

    return (
        <PageLayout>
            <RecordUpload
                onUploadSuccess={() => router.push('/records')}
            />
        </PageLayout>
    );
}
