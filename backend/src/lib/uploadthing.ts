import { createUploadthing, type FileRouter } from "uploadthing/express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "./auth.js";

const f = createUploadthing();

async function getUserFromReq(headers: Headers) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(headers as any),
  });
  return session?.user ?? null;
}

export const uploadRouter = {
  productImageUploader: f({
    image: {
      maxFileSize: "8MB",
      maxFileCount: 5,
    },
  }).onUploadComplete(({ metadata, file }) => {
    console.log("Product image uploaded:", file.name);
    return { url: file.url, name: file.name, size: file.size };
  }),

  avatarUploader: f({
    image: {
      maxFileSize: "2MB",
      maxFileCount: 1,
    },
  }).onUploadComplete(({ metadata, file }) => {
    console.log("Avatar uploaded:", file.name);
    return { url: file.url, name: file.name, size: file.size };
  }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;
