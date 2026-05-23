import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { Camera, Trash2, Upload, User as UserIcon } from 'lucide-react';

interface ProfilePictureUploadProps {
    currentImageUrl?: string;
    onUpload: (file: File) => Promise<any>;
    onDelete: () => Promise<any>;
    firstName?: string;
    lastName?: string;
}

export const ProfilePictureUpload: React.FC<ProfilePictureUploadProps> = ({
    currentImageUrl,
    onUpload,
    onDelete,
    firstName,
    lastName
}) => {
    const [isUploading, setIsUploading] = useState(false);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation
        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file.');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('File size should be less than 5MB.');
            return;
        }

        // Preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);

        setIsUploading(true);
        try {
            await onUpload(file);
            toast.success('Profile picture updated!');
            setPreviewUrl(null);
        } catch (error) {
            toast.error('Failed to upload profile picture.');
            setPreviewUrl(null);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to remove your profile picture?')) return;

        try {
            await onDelete();
            toast.success('Profile picture removed.');
        } catch (error) {
            toast.error('Failed to remove profile picture.');
        }
    };

    const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();

    return (
        <div className="flex flex-col items-center space-y-4">
            <div className="relative group">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    {previewUrl || currentImageUrl ? (
                        <img
                            src={previewUrl || currentImageUrl}
                            alt="Profile"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="flex items-center justify-center w-full h-full text-3xl font-bold text-slate-400 dark:text-slate-500">
                            {initials || <UserIcon size={48} />}
                        </div>
                    )}
                </div>

                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="absolute bottom-0 right-0 p-2 bg-primary dark:bg-primary-light text-white rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all disabled:opacity-50"
                    title="Upload Photo"
                >
                    {isUploading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Camera size={20} />
                    )}
                </button>

                {(currentImageUrl || previewUrl) && !isUploading && (
                    <button
                        onClick={handleDelete}
                        className="absolute bottom-0 left-0 p-2 bg-rose-500 text-white rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all"
                        title="Remove Photo"
                    >
                        <Trash2 size={20} />
                    </button>
                )}
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
            />
            
            <p className="text-xs text-slate-500 dark:text-slate-400">
                JPG, PNG or WebP. Max 5MB.
            </p>
        </div>
    );
};
