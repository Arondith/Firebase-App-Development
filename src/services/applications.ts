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

export function subscribeToApplications(
  userId: string,
  callback: (applications: JobApplication[]) => void,
): Unsubscribe {
  const applicationsQuery = query(
    applicationsCollection,
    where("userId", "==", userId),
  );

  return onSnapshot(applicationsQuery, (snapshot) => {
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
  });
}

export async function createApplication(
  userId: string,
  input: ApplicationInput,
): Promise<string> {
  const created = await addDoc(applicationsCollection, {
    ...input,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
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
  applicationId: string,
  status: ApplicationStatus,
): Promise<void> {
  await updateDoc(doc(db, "applications", applicationId), {
    status,
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
      // The record should still be removable if a file was already deleted.
    }
  }

  await deleteDoc(doc(db, "applications", application.id));
}
