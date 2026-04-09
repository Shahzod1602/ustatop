import { createUploadthing, type FileRouter } from "uploadthing/next"
import { auth } from "@/lib/auth"

const f = createUploadthing()

export const ourFileRouter = {
  profilePhoto: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await auth()
      if (!session?.user) throw new Error("Tizimga kirish kerak")
      return { userId: session.user.id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.url }
    }),

  postImage: f({ image: { maxFileSize: "8MB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await auth()
      if (!session?.user) throw new Error("Tizimga kirish kerak")
      return { userId: session.user.id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.url }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
