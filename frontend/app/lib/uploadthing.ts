import {
  generateUploadButton,
  generateUploadDropzone,
  generateReactHelpers,
} from "@uploadthing/react";

type FileRouter = {
  productImageUploader: any;
  avatarUploader: any;
};

const url = "http://localhost:5000/api/uploadthing";

export const { useUploadThing, uploadFiles } =
  generateReactHelpers<FileRouter>({ url });

export const UploadButton = generateUploadButton<FileRouter>({ url });

export const UploadDropzone = generateUploadDropzone<FileRouter>({ url });
