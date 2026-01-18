import { orpc } from '@/lib/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@template/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@template/ui/components/card';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

interface AvatarUploadProps {
  userId: string;
  currentAvatarUrl?: string | null;
}

export function AvatarUpload({ userId, currentAvatarUrl }: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentAvatarUrl || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation(
    orpc.currentUser.uploadAvatar.mutationOptions({
      onSuccess: async (data) => {
        toast.success('Avatar uploaded successfully!');
        setPreview(data.imageUrl);
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        // Invalidate currentUser query to refresh the user data
        await queryClient.invalidateQueries({
          queryKey: orpc.currentUser.me.queryKey(),
        });
      },
      onError: (error) => {
        console.log(error);
        toast.error('Failed to upload avatar', {
          description: error.message,
        });
      },
    })
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      // ORPC natively supports File objects
      uploadMutation.mutate({
        userId,
        image: selectedFile,
      });
    } catch (error) {
      console.log(error);
      toast.error('Failed to process image');
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreview(currentAvatarUrl || null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Avatar</CardTitle>
        <CardDescription>Upload a profile picture</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center gap-4">
          {preview && (
            <div className="relative h-32 w-32 overflow-hidden rounded-full border-2 border-muted">
              <img src={preview} alt="Avatar preview" className="h-full w-full object-cover" />
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id="avatar-upload"
          />

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
            >
              Choose Image
            </Button>

            {selectedFile && (
              <>
                <Button type="button" onClick={handleUpload} disabled={uploadMutation.isPending}>
                  {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleCancel}
                  disabled={uploadMutation.isPending}
                >
                  Cancel
                </Button>
              </>
            )}
          </div>

          {selectedFile && (
            <p className="text-sm text-muted-foreground">Selected: {selectedFile.name}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
