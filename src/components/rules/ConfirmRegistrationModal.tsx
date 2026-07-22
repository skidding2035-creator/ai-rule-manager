import { Modal } from '@/components/ui/Modal'

interface ConfirmRegistrationModalProps {
  open: boolean
  onClose: () => void
  currentVersion: string
  nextVersion: string
  oldContent: string
  newContent: string
  onApprove: () => void
  onReviseMore: () => void
  onDiscard: () => void
}

export function ConfirmRegistrationModal({
  open,
  onClose,
  currentVersion,
  nextVersion,
  oldContent,
  newContent,
  onApprove,
  onReviseMore,
  onDiscard,
}: ConfirmRegistrationModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="変更内容の確認"
      className="max-w-2xl"
      footer={
        <>
          <button
            onClick={onDiscard}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-400 hover:text-gray-200"
          >
            ③ 登録しない
          </button>
          <button
            onClick={onReviseMore}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-gray-300 hover:border-gray-600"
          >
            ② 修正してから登録
          </button>
          <button
            onClick={onApprove}
            className="rounded-lg bg-accent-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
          >
            ① 承認して登録
          </button>
        </>
      }
    >
      <p className="mb-4 text-sm text-gray-400">
        現在の <span className="font-medium text-gray-200">{currentVersion}</span> を編集し、
        <span className="font-medium text-gray-200"> {nextVersion}</span> として登録します。内容をご確認ください。
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="mb-2 text-xs font-medium text-gray-500">変更前</p>
          <div className="whitespace-pre-wrap rounded-lg border border-border bg-background p-3 text-sm text-gray-400">
            {oldContent}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-medium text-gray-500">変更後</p>
          <div className="whitespace-pre-wrap rounded-lg border border-accent-blue/40 bg-accent-blue/5 p-3 text-sm text-gray-200">
            {newContent}
          </div>
        </div>
      </div>
    </Modal>
  )
}
