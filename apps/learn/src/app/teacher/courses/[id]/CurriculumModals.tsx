"use client";

import { AttachResourceDrawer } from "./AttachResourceDrawer";
import { ResourceSettingsModal } from "./ResourceSettingsModal";
import { ConfirmDetachModal } from "./ConfirmDetachModal";
import { ResourcePreviewModal } from "@/app/teacher/resources/ResourcePreviewModal";
import type { AttachedResource } from "./types";

type CurriculumModalsProps = {
  courseId: number;
  isAttachDrawerOpen: boolean;
  onCloseAttachDrawer: () => void;
  selectedSessionForAttach: number | null;
  totalSessions: number;
  editingResource: AttachedResource | null;
  onCloseSettingsModal: () => void;
  detachingItem: { id: number; title: string } | null;
  onCloseDetachModal: () => void;
  onConfirmDetach: () => void;
  isDetachPending: boolean;
  previewResource: {
    id: number;
    title: string;
    type: string;
    url: string;
    description?: string | null;
    metadata?: Record<string, unknown> | null;
  } | null;
  onClosePreviewModal: () => void;
  onMutationSuccess: () => void;
};

export function CurriculumModals({
  courseId,
  isAttachDrawerOpen,
  onCloseAttachDrawer,
  selectedSessionForAttach,
  totalSessions,
  editingResource,
  onCloseSettingsModal,
  detachingItem,
  onCloseDetachModal,
  onConfirmDetach,
  isDetachPending,
  previewResource,
  onClosePreviewModal,
  onMutationSuccess,
}: CurriculumModalsProps) {
  return (
    <>
      {/* Attach Resource Drawer */}
      <AttachResourceDrawer
        isOpen={isAttachDrawerOpen}
        onClose={onCloseAttachDrawer}
        courseId={courseId}
        initialSessionNumber={selectedSessionForAttach}
        totalSessions={totalSessions}
        onSuccess={onMutationSuccess}
      />

      {/* Resource Settings Modal */}
      {editingResource && (
        <ResourceSettingsModal
          isOpen={Boolean(editingResource)}
          onClose={onCloseSettingsModal}
          courseId={courseId}
          resource={editingResource}
          onSuccess={onMutationSuccess}
        />
      )}

      {/* Confirm Detach Modal */}
      <ConfirmDetachModal
        isOpen={Boolean(detachingItem)}
        onClose={onCloseDetachModal}
        onConfirm={onConfirmDetach}
        title={detachingItem?.title || "Resursă"}
        isPending={isDetachPending}
      />

      {/* Resource Preview Modal */}
      <ResourcePreviewModal
        isOpen={Boolean(previewResource)}
        onClose={onClosePreviewModal}
        resource={previewResource}
      />
    </>
  );
}
