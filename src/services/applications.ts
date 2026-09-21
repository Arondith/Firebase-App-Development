import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import { db, storage } from "../firebase";
import type {
  ApplicationInput,
  ApplicationStatus,
  JobApplication,
} from "../types";

const applicationsCollection = collection(db, "applications");

const stageRank: Record<ApplicationStatus, number> = {
  wishlist: 0,
  applied: 1,
  rejected: 1,
  interview: 2,
  offer: 3,
};

function maxStage(
  current: ApplicationStatus | undefined,
  next: ApplicationStatus,
): ApplicationStatus {
  if (!current) return next;
  return stageRank[next] > stageRank[current] ? next : current;
}

export function subscribeToApplications(
  userId: string,
  callback: (applications: JobApplication[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const applicationsQuery = query(
    applicationsCollection,
    where("userId", "==", userId),
  );

  return onSnapshot(
    applicationsQuery,
    (snapshot) => {
      const applications = snapshot.docs.map((document) => ({
        id: document.id,
        ...(document.data() as Omit<JobApplication, "id">),
      }));

      applications.sort((a, b) => {
        const aTime = a.updatedAt?.toMillis?.() ?? 0;
        const bTime = b.updatedAt?.toMillis?.() ?? 0;
        return bTime - aTime;
      });

      callback(applications);
    },
    (error) => onError?.(error),
  );
}

export async function createApplication(
  userId: string,
  input: ApplicationInput,
): Promise<string> {
  const created = await addDoc(applicationsCollection, {
    ...input,
    userId,
    highestStageReached: input.status,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    statusChangedAt: serverTimestamp(),
  });

  return created.id;
}

export async function updateApplication(
  applicationId: string,
  input: Partial<ApplicationInput>,
): Promise<void> {
  await updateDoc(doc(db, "applications", applicationId), {
    ...input,
    updatedAt: serverTimestamp(),
  });
}

export async function moveApplication(
  application: JobApplication,
  status: ApplicationStatus,
): Promise<void> {
  if (application.status === status) return;

  await updateDoc(doc(db, "applications", application.id), {
    status,
    highestStageReached: maxStage(
      application.highestStageReached ?? application.status,
      status,
    ),
    statusChangedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function uploadApplicationFile(
  userId: string,
  applicationId: string,
  file: File,
): Promise<void> {
  const safeName = file.name.replace(/[^\w.-]/g, "_");
  const storagePath =
    "users/" +
    userId +
    "/applications/" +
    applicationId +
    "/" +
    Date.now() +
    "-" +
    safeName;

  const fileReference = ref(storage, storagePath);
  await uploadBytes(fileReference, file, {
    contentType: file.type || "application/octet-stream",
  });

  const downloadUrl = await getDownloadURL(fileReference);

  await updateDoc(doc(db, "applications", applicationId), {
    attachmentUrl: downloadUrl,
    attachmentName: file.name,
    attachmentPath: storagePath,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteApplication(
  application: JobApplication,
): Promise<void> {
  if (application.attachmentPath) {
    try {
      await deleteObject(ref(storage, application.attachmentPath));
    } catch {
      // Keep deletion idempotent if the file has already been removed.
    }
  }

  await deleteDoc(doc(db, "applications", application.id));
}
