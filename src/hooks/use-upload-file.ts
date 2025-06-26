// https://platejs.org/docs/media#custom-upload-implementation

import { useState } from "react";

interface UseUploadFileProps {
	onUploadComplete?: (file: UploadedFile) => void;
	onUploadError?: (error: unknown) => void;
	headers?: Record<string, string>;
	onUploadBegin?: (fileName: string) => void;
	onUploadProgress?: (progress: { progress: number }) => void;
	skipPolling?: boolean;
}

interface UploadedFile {
	key: string; // Unique identifier
	url: string; // Public URL of the uploaded file
	name: string; // Original filename
	size: number; // File size in bytes
	type: string; // MIME type
}

export function useUploadFile({
	onUploadComplete,
	onUploadError,
	onUploadProgress,
}: UseUploadFileProps = {}) {
	const [uploadedFile, setUploadedFile] = useState<UploadedFile>();
	const [uploadingFile, setUploadingFile] = useState<File>();
	const [progress, setProgress] = useState(0);
	const [isUploading, setIsUploading] = useState(false);

	async function uploadFile(file: File) {
		setIsUploading(true);
		setUploadingFile(file);

		try {
			// Get presigned URL and final URL from your backend
			const { presignedUrl, fileUrl, fileKey } = await fetch("/api/upload", {
				method: "POST",
				body: JSON.stringify({
					filename: file.name,
					contentType: file.type,
				}),
			}).then((r) => r.json());

			// To track upload progress with `fetch`, we create a ReadableStream.
			if (!file.stream) {
				throw new Error(
					"Streaming file uploads are not supported in this browser.",
				);
			}

			const fileStreamReader = file.stream().getReader();
			let bytesSent = 0;

			const stream = new ReadableStream({
				async pull(controller) {
					const { value, done } = await fileStreamReader.read();
					if (done) {
						// Ensure final progress is 100%
						setProgress(100);
						onUploadProgress?.({ progress: 100 });
						controller.close();
						return;
					}

					bytesSent += value.byteLength;
					const progress = Math.min(100, (bytesSent / file.size) * 100);
					setProgress(progress);
					onUploadProgress?.({ progress });

					controller.enqueue(value);
				},
			});

			// Upload to S3 using presigned URL with fetch
			const uploadResponse = await fetch(presignedUrl, {
				method: "PUT",
				headers: { "Content-Type": file.type },
				body: stream,
				// @ts-expect-error - `duplex` is not in standard lib.dom.d.ts yet, but is required by some environments for streaming request bodies
				duplex: "half",
			});

			if (!uploadResponse.ok) {
				throw new Error(`Upload failed with status: ${uploadResponse.status}`);
			}

			const uploadedFile = {
				key: fileKey,
				url: fileUrl,
				name: file.name,
				size: file.size,
				type: file.type,
			};

			setUploadedFile(uploadedFile);
			onUploadComplete?.(uploadedFile);

			return uploadedFile;
		} catch (error) {
			onUploadError?.(error);
			throw error;
		} finally {
			setProgress(0);
			setIsUploading(false);
			setUploadingFile(undefined);
		}
	}

	return {
		isUploading,
		progress,
		uploadFile,
		uploadedFile,
		uploadingFile,
	};
}
