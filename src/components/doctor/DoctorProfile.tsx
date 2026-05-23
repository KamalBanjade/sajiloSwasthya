import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { doctorApi, DoctorExtendedProfile } from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ProfilePictureUpload } from '@/components/profile/ProfilePictureUpload';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface DoctorProfileData {
    department: string;
    specialization: string;
    hospitalAffiliation: string;
    contactNumber: string;
}
export const DoctorProfile: React.FC = () => {
    const [isSaving, setIsSaving] = useState(false);
    const queryClient = useQueryClient();

    const { data: profileResponse, isLoading: isProfileLoading, error: queryError } = useQuery({
        queryKey: ['doctor-profile'],
        queryFn: () => doctorApi.getProfile(),
    });

    const { register, handleSubmit, reset } = useForm<DoctorProfileData>();

    useEffect(() => {
        if (profileResponse?.data) {
            const data = profileResponse.data;
            reset({
                department: data.departmentName || '',
                specialization: data.specialization || '',
                hospitalAffiliation: data.hospitalAffiliation || '',
                contactNumber: data.contactNumber || '',
            });
        }
    }, [profileResponse, reset]);

    const onSubmit = async (data: DoctorProfileData) => {
        setIsSaving(true);
        try {
            await doctorApi.updateProfile(data as any);
            toast.success('Profile updated successfully!');
            queryClient.invalidateQueries({ queryKey: ['doctor-profile'] });
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update profile.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleImageUpload = async (file: File) => {
        await doctorApi.uploadProfilePicture(file);
        queryClient.invalidateQueries({ queryKey: ['doctor-profile'] });
    };

    const handleImageDelete = async () => {
        await doctorApi.deleteProfilePicture();
        queryClient.invalidateQueries({ queryKey: ['doctor-profile'] });
    };

    if (isProfileLoading) {
        return <div className="animate-pulse bg-slate-100 dark:bg-slate-800 rounded-3xl h-64 w-full"></div>;
    }

    if (queryError) {
        return (
            <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 p-6 rounded-3xl border border-rose-100 dark:border-rose-800/50 text-sm font-semibold">
                Failed to load profile details.
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/60 dark:border-slate-800 shadow-premium dark:shadow-none">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Professional Details</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Manage your clinical and professional settings</p>
                </div>
                <ProfilePictureUpload
                    currentImageUrl={profileResponse?.data?.profilePictureUrl}
                    onUpload={handleImageUpload}
                    onDelete={handleImageDelete}
                    firstName={profileResponse?.data?.firstName}
                    lastName={profileResponse?.data?.lastName}
                />
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Department"
                        placeholder="e.g. Cardiology"
                        {...register('department')}
                    />
                    <Input
                        label="Specialization"
                        placeholder="e.g. Pediatric Surgery"
                        {...register('specialization')}
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Hospital Affiliation"
                        placeholder="e.g. City General Hospital"
                        {...register('hospitalAffiliation')}
                    />
                    <Input
                        label="Contact Number"
                        placeholder="+1 234 567 8900"
                        {...register('contactNumber')}
                    />
                </div>

                <div className="pt-4 flex justify-end">
                    <Button type="submit" isLoading={isSaving}>
                        Save Details
                    </Button>
                </div>
            </form>
        </div>
    );
};
